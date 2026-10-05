import EmergencyRequest from '../models/EmergencyRequest.js';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';

import {
  completeResourceHandover
} from '../services/hospitalResourceService.js';


const HANDOVER_RADIUS_METERS = 200;


// --------------------------------------------------
// Calculate distance between two GeoJSON points
// --------------------------------------------------

const calculateDistance = (
  point1,
  point2
) => {

  const [lon1, lat1] =
    point1.coordinates;

  const [lon2, lat2] =
    point2.coordinates;


  const toRadians =
    degrees =>
      degrees * Math.PI / 180;


  const EARTH_RADIUS_METERS = 6371000;


  const dLat =
    toRadians(lat2 - lat1);

  const dLon =
    toRadians(lon2 - lon1);


  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return EARTH_RADIUS_METERS * c;
};


// --------------------------------------------------
// Complete handover
// --------------------------------------------------

export const completeHandover =
  async (req, res, next) => {

    try {

      const {
        id: emergencyId
      } = req.params;

      const {
        type
      } = req.body;


      // --------------------------------------------
      // Validate handover type
      // --------------------------------------------

      if (
        !['ARRIVED', 'ANYWAY'].includes(type)
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Handover type must be ARRIVED or ANYWAY'
        });
      }


      // --------------------------------------------
      // Find emergency
      // --------------------------------------------

      const emergency =
        await EmergencyRequest.findById(
          emergencyId
        );


      if (!emergency) {

        return res.status(404).json({
          success: false,
          message:
            'Emergency request not found'
        });
      }


      // --------------------------------------------
      // Verify ambulance ownership
      // --------------------------------------------

      if (
        emergency.ambulanceId.toString() !==
        req.user._id.toString()
      ) {

        return res.status(403).json({
          success: false,
          message:
            'You are not authorized to complete this handover'
        });
      }


      // --------------------------------------------
      // Verify hospital assignment
      // --------------------------------------------

      if (!emergency.assignedHospital) {

        return res.status(400).json({
          success: false,
          message:
            'No hospital is assigned to this emergency'
        });
      }


      // --------------------------------------------
      // Verify emergency status
      // --------------------------------------------

      if (
        emergency.status !==
        'HOSPITAL_ASSIGNED'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Handover is only allowed after hospital assignment'
        });
      }


      // --------------------------------------------
      // Prevent duplicate handover
      // --------------------------------------------

      if (
        emergency.handover?.status ===
        'COMPLETED'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Handover has already been completed'
        });
      }


      // --------------------------------------------
      // Get current ambulance location
      // --------------------------------------------

      const ambulance =
        await Ambulance.findById(
          emergency.ambulanceId
        )
          .select('currentLocation')
          .lean();


      if (
        !ambulance ||
        !ambulance.currentLocation
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Ambulance current location is unavailable'
        });
      }


      // --------------------------------------------
      // Get assigned hospital location
      // --------------------------------------------

      const hospital =
        await Hospital.findById(
          emergency.assignedHospital
        )
          .select('location')
          .lean();


      if (
        !hospital ||
        !hospital.location
      ) {

        return res.status(404).json({
          success: false,
          message:
            'Assigned hospital location is unavailable'
        });
      }


      // --------------------------------------------
      // ARRIVED → verify hospital radius
      // --------------------------------------------

      if (type === 'ARRIVED') {

        const distance =
          calculateDistance(
            ambulance.currentLocation,
            hospital.location
          );


        if (
          distance >
          HANDOVER_RADIUS_METERS
        ) {

          return res.status(400).json({
            success: false,

            message:
              'Ambulance is outside the hospital handover radius',

            distanceMeters:
              Math.round(distance),

            requiredRadiusMeters:
              HANDOVER_RADIUS_METERS
          });
        }
      }


      // --------------------------------------------
      // Move resources
      //
      // RESERVED → OCCUPIED
      // --------------------------------------------

      await completeResourceHandover({
        hospitalId:
          emergency.assignedHospital,

        requiredResources:
          emergency
            .confirmedRequirements
            .requiredResources
      });


      // --------------------------------------------
      // Complete handover
      // --------------------------------------------

      emergency.handover = {
        status: 'COMPLETED',

        type,

        completedAt:
          new Date()
      };


      emergency.status =
        'COMPLETED';


      await emergency.save();


      // --------------------------------------------
      // Response
      // --------------------------------------------

      return res.status(200).json({

        success: true,

        message:
          'Handover completed successfully',

        emergency: {
          id:
            emergency.id,

          status:
            emergency.status,

          handover:
            emergency.handover
        }
      });

    } catch (error) {

      next(error);
    }
  };