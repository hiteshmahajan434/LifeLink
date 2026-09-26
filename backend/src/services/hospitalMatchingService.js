import Hospital from '../models/Hospital.js';
import HospitalResource from '../models/HospitalResource.js';
import HospitalEmergencyRequest from '../models/HospitalEmergencyRequest.js';

const BATCH_SIZE = 2;


/**
 * Check whether a hospital has all required resources.
 *
 * available = total - occupied - reserved
 */
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

    const resource = hospitalResource[resourceType];

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

  // Oxygen requirement
  if (
    requiredResources.oxygenSupply === true &&
    hospitalResource.oxygenSupply !== true
  ) {
    return false;
  }

  // Blood bank requirement
  if (
    requiredResources.bloodBank === true &&
    hospitalResource.bloodBank !== true
  ) {
    return false;
  }

  return true;
};


/**
 * Calculate distance between two GeoJSON points.
 *
 * coordinates format:
 * [longitude, latitude]
 *
 * Returns distance in kilometres.
 */
const calculateDistanceInKm = (
  emergencyCoordinates,
  hospitalCoordinates
) => {
  const [longitude1, latitude1] = emergencyCoordinates;
  const [longitude2, latitude2] = hospitalCoordinates;

  const earthRadiusKm = 6371;

  const latitude1Rad =
    (latitude1 * Math.PI) / 180;

  const latitude2Rad =
    (latitude2 * Math.PI) / 180;

  const deltaLatitude =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const deltaLongitude =
    ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1Rad) *
      Math.cos(latitude2Rad) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};


/**
 * Find eligible hospitals, rank them,
 * and create the first batch of hospital requests.
 */
export const startHospitalMatching = async (
  emergency
) => {

  const requiredResources =
    emergency.confirmedRequirements.requiredResources;

  const emergencyCoordinates =
    emergency.location.coordinates;


  // ----------------------------------
  // 1. Get hospitals
  // ----------------------------------

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


  // ----------------------------------
  // 2. Get resources
  // ----------------------------------

  const hospitalIds =
    hospitals.map((hospital) => hospital._id);

  const hospitalResources =
    await HospitalResource.find({
      hospitalId: {
        $in: hospitalIds
      }
    }).lean();


  // Create quick lookup map
  const resourceMap = new Map();

  for (const resource of hospitalResources) {
    resourceMap.set(
      resource.hospitalId.toString(),
      resource
    );
  }


  // ----------------------------------
  // 3. Filter eligible hospitals
  // ----------------------------------

  const eligibleHospitals = [];

  for (const hospital of hospitals) {

    const resource =
      resourceMap.get(
        hospital._id.toString()
      );

    // Hospital has no resource document
    if (!resource) {
      continue;
    }


    // Check resource availability
    const isEligible =
      hasRequiredResources(
        resource,
        requiredResources
      );

    if (!isEligible) {
      continue;
    }


    // Calculate distance
    const distanceKm =
      calculateDistanceInKm(
        emergencyCoordinates,
        hospital.location.coordinates
      );


    eligibleHospitals.push({
      hospital,
      resource,
      distanceKm
    });
  }


  // ----------------------------------
  // 4. Rank hospitals
  // ----------------------------------

  // MVP ranking:
  // nearest eligible hospital first

  eligibleHospitals.sort(
    (a, b) =>
      a.distanceKm - b.distanceKm
  );
  console.log(eligibleHospitals);


  // ----------------------------------
  // 5. Select first batch
  // ----------------------------------

  const selectedHospitals =
    eligibleHospitals.slice(
      0,
      BATCH_SIZE
    );


  if (selectedHospitals.length === 0) {
    return {
      success: false,
      message:
        'No suitable hospitals found for the required resources',
      selectedHospitals: []
    };
  }


  // ----------------------------------
  // 6. Create hospital requests
  // ----------------------------------

  const hospitalRequests =
    await HospitalEmergencyRequest.insertMany(
      selectedHospitals.map(
        ({ hospital }) => ({
          emergencyId: emergency._id,

          hospitalId: hospital._id,

          status: 'PENDING',

          batchNumber: 1,

          sentAt: new Date()
        })
      )
    );


  // ----------------------------------
  // 7. Return selected hospitals
  // ----------------------------------

  return {
    success: true,

    message:
      'Hospital requests created successfully',

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

          batchNumber: 1,

          hospitalRequestId:
            hospitalRequests[index]._id
        })
      )
  };
};