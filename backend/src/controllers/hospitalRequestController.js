import HospitalEmergencyRequest from '../models/HospitalEmergencyRequest.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import HospitalResource from '../models/HospitalResource.js';

import {
  checkBatchAndCreateNext
} from '../services/hospitalMatchingService.js';

// --------------------------------------------------
// GET hospital requests
// --------------------------------------------------

export const getHospitalRequests = async (
  req,
  res,
  next
) => {
  try {
    const hospitalId = req.user?._id;

    if (!hospitalId) {
      return res.status(401).json({
        success: false,
        message:
          'Authenticated hospital ID is missing'
      });
    }

    const requests =
      await HospitalEmergencyRequest.find({
        hospitalId
      })
        .populate({
          path: 'emergencyId',
          select:
            'id ambulanceId location inputs aiParsedRequirements confirmedRequirements status createdAt assignedHospital'
        })
        .sort({
          createdAt: -1
        });

    return res.status(200).json({
      success: true,
      message:
        'Hospital requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// ACCEPT
// --------------------------------------------------

export const acceptHospitalRequest =
  async (req, res, next) => {
    try {
      const hospitalId =
        req.user?._id;

      if (!hospitalId) {
        return res.status(401).json({
          success: false,
          message:
            'Authenticated hospital ID is missing'
        });
      }

      const { requestId } =
        req.params;

      // Find request belonging to this hospital
      const hospitalRequest =
        await HospitalEmergencyRequest.findOne({
          _id: requestId,
          hospitalId
        });

      if (!hospitalRequest) {
        return res.status(404).json({
          success: false,
          message:
            'Hospital request not found'
        });
      }

      // Must be pending
      if (
        hospitalRequest.status !==
        'PENDING'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Only pending requests can be accepted'
        });
      }

      // Check expiry
      if (
        hospitalRequest.expiresAt <=
        new Date()
      ) {
        hospitalRequest.status =
          'EXPIRED';

        hospitalRequest.respondedAt =
          new Date();

        await hospitalRequest.save();

        return res.status(400).json({
          success: false,
          message:
            'This hospital request has expired'
        });
      }

      // Get emergency
      const emergency =
        await EmergencyRequest.findById(
          hospitalRequest.emergencyId
        );

      if (!emergency) {
        return res.status(404).json({
          success: false,
          message:
            'Emergency request not found'
        });
      }

      // Another hospital already accepted
      if (emergency.assignedHospital) {
        hospitalRequest.status =
          'CANCELLED';

        hospitalRequest.respondedAt =
          new Date();

        await hospitalRequest.save();

        return res.status(409).json({
          success: false,
          message:
            'This emergency has already been assigned to another hospital'
        });
      }

      // Get current hospital resources
      const hospitalResource =
        await HospitalResource.findOne({
          hospitalId
        });

      if (!hospitalResource) {
        return res.status(404).json({
          success: false,
          message:
            'Hospital resources not found'
        });
      }

      const requiredResources =
        emergency.confirmedRequirements
          .requiredResources;

      const numericResources = [
        'icuBeds',
        'traumaBeds',
        'generalBeds',
        'ventilators'
      ];

      // Check resources again
      for (
        const resourceType of numericResources
      ) {
        const requiredAmount =
          requiredResources[
            resourceType
          ] ?? 0;

        if (
          requiredAmount === 0
        ) {
          continue;
        }

        const resource =
          hospitalResource[
            resourceType
          ];

        const available =
          resource.total -
          resource.occupied -
          resource.reserved;

        if (
          available <
          requiredAmount
        ) {
          return res.status(409).json({
            success: false,
            message:
              `Not enough ${resourceType} available`
          });
        }
      }

      // Check boolean resources
      if (
        requiredResources.oxygenSupply ===
          true &&
        hospitalResource.oxygenSupply !==
          true
      ) {
        return res.status(409).json({
          success: false,
          message:
            'Oxygen supply is not available'
        });
      }

      if (
        requiredResources.bloodBank ===
          true &&
        hospitalResource.bloodBank !==
          true
      ) {
        return res.status(409).json({
          success: false,
          message:
            'Blood bank is not available'
        });
      }

      // Reserve resources
      for (
        const resourceType of numericResources
      ) {
        const requiredAmount =
          requiredResources[
            resourceType
          ] ?? 0;

        hospitalResource[
          resourceType
        ].reserved += requiredAmount;
      }

      await hospitalResource.save();

      // Accept this hospital request
      hospitalRequest.status =
        'ACCEPTED';

      hospitalRequest.respondedAt =
        new Date();

      await hospitalRequest.save();

      // Assign hospital
      emergency.assignedHospital =
        hospitalId;

      emergency.status =
        'HOSPITAL_ASSIGNED';

      await emergency.save();

      // Cancel all other pending hospitals
      await HospitalEmergencyRequest.updateMany(
        {
          emergencyId:
            emergency._id,

          _id: {
            $ne:
              hospitalRequest._id
          },

          status: 'PENDING'
        },
        {
          $set: {
            status: 'CANCELLED',
            respondedAt:
              new Date()
          }
        }
      );

      return res.status(200).json({
        success: true,
        message:
          'Emergency accepted successfully',

        data: {
          hospitalRequest,
          emergency
        }
      });
    } catch (error) {
      next(error);
    }
  };

// --------------------------------------------------
// REJECT
// --------------------------------------------------

export const rejectHospitalRequest =
  async (req, res, next) => {
    try {
      const hospitalId =
        req.user?._id;

      if (!hospitalId) {
        return res.status(401).json({
          success: false,
          message:
            'Authenticated hospital ID is missing'
        });
      }

      const { requestId } =
        req.params;

      const hospitalRequest =
        await HospitalEmergencyRequest.findOne({
          _id: requestId,
          hospitalId
        });

      if (!hospitalRequest) {
        return res.status(404).json({
          success: false,
          message:
            'Hospital request not found'
        });
      }

      if (
        hospitalRequest.status !==
        'PENDING'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Only pending requests can be rejected'
        });
      }

      // Reject
      hospitalRequest.status =
        'REJECTED';

      hospitalRequest.respondedAt =
        new Date();

      await hospitalRequest.save();

      // Check whether next batch
      // should be created
      const nextBatch =
        await checkBatchAndCreateNext(
          hospitalRequest.emergencyId,
          hospitalRequest.batchNumber
        );

      return res.status(200).json({
        success: true,
        message:
          'Hospital request rejected',

        data: {
          hospitalRequest,
          nextBatch:
            nextBatch.success
              ? nextBatch
              : null
        }
      });
    } catch (error) {
      next(error);
    }
  };