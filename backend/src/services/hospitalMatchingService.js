import Hospital from '../models/Hospital.js';
import HospitalResource from '../models/HospitalResource.js';
import HospitalEmergencyRequest from '../models/HospitalEmergencyRequest.js';
import EmergencyRequest from '../models/EmergencyRequest.js';

import { getIO } from '../socket/socket.js';
import { getRoadDistances } from './routingService.js';

const BATCH_SIZE = 2;

const HOSPITAL_RESPONSE_WINDOW_MS = 60 * 1000;

// --------------------------------------------------
// Check whether hospital has required resources
// --------------------------------------------------

const hasRequiredResources = (
  hospitalResource,
  requiredResources
) => {
  const numericResources = [
    'icuBeds',
    'traumaBeds',
    'generalBeds',
    'ventilators'
  ];

  for (const resourceType of numericResources) {
    const requiredAmount =
      requiredResources[resourceType] ?? 0;

    if (requiredAmount === 0) {
      continue;
    }

    const resource =
      hospitalResource[resourceType];

    if (!resource) {
      return false;
    }

    const available =
      resource.total -
      resource.occupied -
      resource.reserved;

    if (available < requiredAmount) {
      return false;
    }
  }

  if (
    requiredResources.oxygenSupply === true &&
    hospitalResource.oxygenSupply !== true
  ) {
    return false;
  }

  if (
    requiredResources.bloodBank === true &&
    hospitalResource.bloodBank !== true
  ) {
    return false;
  }

  return true;
};



// --------------------------------------------------
// Create next hospital batch
// --------------------------------------------------

export const createHospitalBatch = async (
  emergency,
  batchNumber
) => {
  const requiredResources =
    emergency.confirmedRequirements.requiredResources;

  const emergencyCoordinates =
    emergency.location.coordinates;

  // Get all hospitals
  const hospitals = await Hospital.find({
    location: { $exists: true }
  }).lean();

  if (hospitals.length === 0) {
    return {
      success: false,
      message: 'No hospitals found',
      selectedHospitals: []
    };
  }

  // Find hospitals already contacted
  const previousRequests =
    await HospitalEmergencyRequest.find({
      emergencyId: emergency._id
    })
      .select('hospitalId')
      .lean();

  const contactedHospitalIds =
    new Set(
      previousRequests.map(
        request =>
          request.hospitalId.toString()
      )
    );

  // Get hospital resources
  const hospitalIds =
    hospitals.map(
      hospital => hospital._id
    );

  const hospitalResources =
    await HospitalResource.find({
      hospitalId: {
        $in: hospitalIds
      }
    }).lean();

  const resourceMap = new Map();

  for (const resource of hospitalResources) {
    resourceMap.set(
      resource.hospitalId.toString(),
      resource
    );
  }


  const eligibleHospitals = [];

  for (const hospital of hospitals) {
    // Do not contact the same hospital again
    if (
      contactedHospitalIds.has(
        hospital._id.toString()
      )
    ) {
      continue;
    }

    const resource =
      resourceMap.get(
        hospital._id.toString()
      );

    if (!resource) {
      continue;
    }

    const eligible =
      hasRequiredResources(
        resource,
        requiredResources
      );

    if (!eligible) {
      continue;
    }

    eligibleHospitals.push({
      hospital
    });
  }

  if (eligibleHospitals.length === 0) {
    return {
      success: false,
      message:
        'No more suitable hospitals available',
      selectedHospitals: []
    };
  }

  const roadDistances = await getRoadDistances({
    origin: emergencyCoordinates,
    destinations: eligibleHospitals.map(
      ({ hospital }) =>
        hospital.location.coordinates
    )
  });

  eligibleHospitals.forEach(
    (item, index) => {
      item.distanceKm =
        roadDistances[index].distanceKm;

      item.durationMinutes =
        roadDistances[index].durationMinutes;
    }
  );

  // Nearest hospitals first
  eligibleHospitals.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }

    return a.durationMinutes - b.durationMinutes;
  });

  console.log(eligibleHospitals);

  // Select next batch
  const selectedHospitals =
    eligibleHospitals.slice(
      0,
      BATCH_SIZE
    );

  if (
    selectedHospitals.length === 0
  ) {
    return {
      success: false,
      message:
        'No more suitable hospitals available',
      selectedHospitals: []
    };
  }

  const sentAt = new Date();

  const expiresAt = new Date(
    sentAt.getTime() +
    HOSPITAL_RESPONSE_WINDOW_MS
  );

  const hospitalRequests =
    await HospitalEmergencyRequest.insertMany(
      selectedHospitals.map(
        ({ hospital }) => ({
          emergencyId:
            emergency._id,

          hospitalId:
            hospital._id,

          status: 'PENDING',

          batchNumber,

          sentAt,

          expiresAt
        })
      )
    );

  // --------------------------------------------------
  // Notify selected hospitals
  // --------------------------------------------------

  const io = getIO();

  hospitalRequests.forEach((request, index) => {
    const hospital = selectedHospitals[index].hospital;

    io.to(`hospital:${hospital.id}`).emit(
      'emergency:new',
      {
        _id: request._id,

        emergencyId: {
          _id: emergency._id,
          id: emergency.id,
          location: emergency.location,
          confirmedRequirements:
            emergency.confirmedRequirements,
          status: emergency.status,
          createdAt: emergency.createdAt
        },

        hospitalId: hospital._id,

        status: 'PENDING',

        batchNumber,

        sentAt,
        expiresAt,

        createdAt: request.createdAt
      }
    );
  });

  return {
    success: true,

    message:
      `Hospital batch ${batchNumber} created successfully`,

    selectedHospitals:
      selectedHospitals.map(
        (item, index) => ({
          hospitalId:
            item.hospital._id,

          hospitalCode:
            item.hospital.id,

          hospitalName:
            item.hospital.name,

          distanceKm:
            Number(
              item.distanceKm.toFixed(2)
            ),

          batchNumber,

          hospitalRequestId:
            hospitalRequests[index]._id,

          expiresAt
        })
      )
  };
};

// --------------------------------------------------
// Check whether the current batch is finished
// --------------------------------------------------

export const checkBatchAndCreateNext =
  async (
    emergencyId,
    batchNumber
  ) => {
    const emergency =
      await EmergencyRequest.findById(
        emergencyId
      );

    if (!emergency) {
      return {
        success: false,
        message: 'Emergency not found'
      };
    }

    // Someone already accepted
    if (emergency.assignedHospital) {
      return {
        success: false,
        message:
          'Emergency already assigned to a hospital'
      };
    }

    // Get current batch
    const batchRequests =
      await HospitalEmergencyRequest.find({
        emergencyId,
        batchNumber
      });

    if (batchRequests.length === 0) {
      return {
        success: false,
        message: 'Hospital batch not found'
      };
    }

    // If any hospital is still pending,
    // do not create next batch
    const hasPending =
      batchRequests.some(
        request =>
          request.status === 'PENDING'
      );

    if (hasPending) {
      return {
        success: false,
        message:
          'Current batch still has pending requests'
      };
    }

    // All hospitals have responded
    const nextBatchNumber =
      batchNumber + 1;

    const nextBatch =
      await createHospitalBatch(
        emergency,
        nextBatchNumber
      );

    if (!nextBatch.success) {
      emergency.status = 'CONFIRMED';

      await emergency.save();

      return nextBatch;
    }

    emergency.status =
      'HOSPITALS_PINGED';

    await emergency.save();

    return nextBatch;
  };

// --------------------------------------------------
// Expire requests whose 1-minute window ended
// --------------------------------------------------

export const processExpiredHospitalRequests =
  async () => {
    const now = new Date();

    const expiredRequests =
      await HospitalEmergencyRequest.find({
        status: 'PENDING',
        expiresAt: {
          $lte: now
        }
      });

    const affectedBatches = new Map();

    for (const request of expiredRequests) {
      request.status = 'EXPIRED';
      request.respondedAt = now;

      await request.save();

      const key =
        `${request.emergencyId.toString()}_${request.batchNumber}`;

      affectedBatches.set(
        key,
        {
          emergencyId:
            request.emergencyId,
          batchNumber:
            request.batchNumber
        }
      );
    }

    // Check affected batches
    for (
      const {
        emergencyId,
        batchNumber
      } of affectedBatches.values()
    ) {
      await checkBatchAndCreateNext(
        emergencyId,
        batchNumber
      );
    }

    return {
      success: true,
      expiredCount:
        expiredRequests.length
    };
  };