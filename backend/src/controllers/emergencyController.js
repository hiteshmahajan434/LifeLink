import EmergencyRequest from '../models/EmergencyRequest.js';
import { generateEmergencyId } from '../utils/counterService.js';
import { parseEmergencyRequirements } from '../services/aiParserService.js';
import { createHospitalBatch } from '../services/hospitalMatchingService.js';
import HospitalEmergencyRequest from '../models/HospitalEmergencyRequest.js';
import { getIO } from '../socket/socket.js';

const EMERGENCY_TYPES = [
  'ROAD_ACCIDENT',
  'CARDIAC_EMERGENCY',
  'BREATHING_EMERGENCY',
  'STROKE',
  'SEVERE_INJURY',
  'BURN',
  'POISONING',
  'PREGNANCY',
  'UNCONSCIOUS',
  'OTHER',
];

/**
 * Create Emergency Request
 * POST /api/emergency
 */
export const createEmergencyRequest = async (req, res, next) => {
  try {
    // ----------------------------------
    // 1. Get authenticated ambulance ID
    // ----------------------------------

    const ambulanceId = req.user?._id;

    if (!ambulanceId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated ambulance ID is missing',
      });
    }

    // ----------------------------------
    // 2. Read request body
    // ----------------------------------

    const { inputs, location, patients } = req.body;

    // Patients must NEVER come from frontend.
    // AI will extract them from the available input.
    if (patients !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          'patients must not be provided. Patient information is extracted by the AI parser.',
      });
    }

    // ----------------------------------
    // 3. Validate inputs
    // ----------------------------------

    if (
      !inputs ||
      typeof inputs !== 'object' ||
      Array.isArray(inputs)
    ) {
      return res.status(400).json({
        success: false,
        message: 'inputs object is required',
      });
    }

    // ----------------------------------
    // 4. Validate available input sources
    // ----------------------------------

    const hasText =
      typeof inputs.text === 'string' &&
      inputs.text.trim().length > 0;

    const hasVoiceTranscript =
      typeof inputs.voiceTranscript === 'string' &&
      inputs.voiceTranscript.trim().length > 0;

    const hasQuickSelect =
      inputs.quickSelect !== undefined &&
      inputs.quickSelect !== null;

    // At least ONE of the three must be provided.
    if (!hasText && !hasVoiceTranscript && !hasQuickSelect) {
      return res.status(400).json({
        success: false,
        message:
          'At least one of text, voiceTranscript, or quickSelect is required',
      });
    }

    // ----------------------------------
    // 5. Validate quickSelect IF provided
    // ----------------------------------

    let sanitizedQuickSelect = null;

    if (hasQuickSelect) {
      if (
        typeof inputs.quickSelect !== 'object' ||
        Array.isArray(inputs.quickSelect)
      ) {
        return res.status(400).json({
          success: false,
          message: 'quickSelect must be an object',
        });
      }

      const quickSelect = inputs.quickSelect;
      const sanitized = {};

      // ----------------------------------
      // emergencyType - OPTIONAL
      // ----------------------------------

      if (
        quickSelect.emergencyType !== undefined &&
        quickSelect.emergencyType !== null &&
        quickSelect.emergencyType !== ''
      ) {
        if (
          typeof quickSelect.emergencyType !== 'string'
        ) {
          return res.status(400).json({
            success: false,
            message: 'emergencyType must be a string.',
          });
        }

        const emergencyType =
          quickSelect.emergencyType.trim();

        if (!EMERGENCY_TYPES.includes(emergencyType)) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid emergencyType. Allowed values: ${EMERGENCY_TYPES.join(', ')}`,
          });
        }

        sanitized.emergencyType = emergencyType;
      }

      // ----------------------------------
      // patientCount - OPTIONAL
      // ----------------------------------

      if (
        quickSelect.patientCount !== undefined &&
        quickSelect.patientCount !== null &&
        quickSelect.patientCount !== ''
      ) {
        if (
          !Number.isInteger(quickSelect.patientCount) ||
          quickSelect.patientCount < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              'patientCount must be a positive integer.',
          });
        }

        sanitized.patientCount =
          quickSelect.patientCount;
      }

      // ----------------------------------
      // requiredResources - OPTIONAL
      // ----------------------------------

      if (
        quickSelect.requiredResources !== undefined &&
        quickSelect.requiredResources !== null
      ) {
        const requiredResources =
          quickSelect.requiredResources;

        if (
          typeof requiredResources !== 'object' ||
          Array.isArray(requiredResources)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'requiredResources must be an object.',
          });
        }

        const {
          icuBeds,
          traumaBeds,
          generalBeds,
          ventilators,
          oxygenSupply,
          bloodBank,
        } = requiredResources;

        const isNonNegativeNumber = (value) =>
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= 0;

        // Only validate numeric fields when provided.
        if (
          icuBeds !== undefined &&
          !isNonNegativeNumber(icuBeds)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'icuBeds must be a number >= 0.',
          });
        }

        if (
          traumaBeds !== undefined &&
          !isNonNegativeNumber(traumaBeds)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'traumaBeds must be a number >= 0.',
          });
        }

        if (
          generalBeds !== undefined &&
          !isNonNegativeNumber(generalBeds)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'generalBeds must be a number >= 0.',
          });
        }

        if (
          ventilators !== undefined &&
          !isNonNegativeNumber(ventilators)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'ventilators must be a number >= 0.',
          });
        }

        // Only validate boolean fields when provided.
        if (
          oxygenSupply !== undefined &&
          typeof oxygenSupply !== 'boolean'
        ) {
          return res.status(400).json({
            success: false,
            message:
              'oxygenSupply must be a boolean.',
          });
        }

        if (
          bloodBank !== undefined &&
          typeof bloodBank !== 'boolean'
        ) {
          return res.status(400).json({
            success: false,
            message:
              'bloodBank must be a boolean.',
          });
        }

        const sanitizedResources = {
          ...(icuBeds !== undefined && {
            icuBeds,
          }),
          ...(traumaBeds !== undefined && {
            traumaBeds,
          }),
          ...(generalBeds !== undefined && {
            generalBeds,
          }),
          ...(ventilators !== undefined && {
            ventilators,
          }),
          ...(oxygenSupply !== undefined && {
            oxygenSupply,
          }),
          ...(bloodBank !== undefined && {
            bloodBank,
          }),
        };

        if (
          Object.keys(sanitizedResources).length > 0
        ) {
          sanitized.requiredResources =
            sanitizedResources;
        }
      }

      // Only store quickSelect if at least one
      // Quick Select field was actually provided.
      if (Object.keys(sanitized).length > 0) {
        sanitizedQuickSelect = sanitized;
      }
    }

    // ----------------------------------
    // 6. Validate location
    // ----------------------------------

    if (
      !location ||
      typeof location !== 'object' ||
      Array.isArray(location) ||
      location.type !== 'Point' ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      typeof location.coordinates[0] !== 'number' ||
      !Number.isFinite(location.coordinates[0]) ||
      typeof location.coordinates[1] !== 'number' ||
      !Number.isFinite(location.coordinates[1])
    ) {
      return res.status(400).json({
        success: false,
        message:
          'location must be a valid GeoJSON Point with [longitude, latitude] coordinates',
      });
    }

    const [longitude, latitude] =
      location.coordinates;

    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Coordinates must be valid numbers: longitude between -180 and 180, latitude between -90 and 90',
      });
    }

    // ----------------------------------
    // 7. Prepare sanitized inputs
    // ----------------------------------

    const sanitizedInputs = {
      text: hasText ? inputs.text.trim() : null,

      voiceTranscript: hasVoiceTranscript
        ? inputs.voiceTranscript.trim()
        : null,

      quickSelect: sanitizedQuickSelect,
    };

    // ----------------------------------
    // 8. AI PARSING
    // ----------------------------------

    // The AI receives whatever input is available:
    // text, voiceTranscript, quickSelect, or
    // any combination of them.

    const aiParsedRequirements =
      await parseEmergencyRequirements(sanitizedInputs);

    // ----------------------------------
    // 9. Generate EMG ID
    // ----------------------------------

    const id = await generateEmergencyId();

    // ----------------------------------
    // 10. Create Emergency Request
    // ----------------------------------

    const emergencyRequest =
      new EmergencyRequest({
        id,

        ambulanceId,

        location: {
          type: 'Point',
          coordinates: [
            longitude,
            latitude,
          ],
        },

        inputs: sanitizedInputs,

        aiParsedRequirements,

        confirmedRequirements:
          aiParsedRequirements,

        status: 'PARSED',
      });

    // ----------------------------------
    // 11. Save
    // ----------------------------------

    await emergencyRequest.save();

    // ----------------------------------
    // 12. Return complete request
    // ----------------------------------

    return res.status(201).json({
      success: true,
      message:
        'Emergency request parsed successfully',
      data: emergencyRequest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Emergency Requirements
 * PUT /api/emergency/:id
 */
export const updateEmergencyRequest = async (
  req,
  res,
  next
) => {
  try {
    const ambulanceId = req.user?._id;

    if (!ambulanceId) {
      return res.status(401).json({
        success: false,
        message:
          'Authenticated ambulance ID is missing',
      });
    }

    const { id } = req.params;
    const { confirmedRequirements } =
      req.body;

    if (!confirmedRequirements) {
      return res.status(400).json({
        success: false,
        message:
          'confirmedRequirements is required',
      });
    }

    const emergencyRequest =
      await EmergencyRequest.findById(id);

    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message:
          'Emergency request not found',
      });
    }

    if (
      emergencyRequest.status !== 'PARSED'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Only parsed emergency requests can be edited',
      });
    }

    emergencyRequest.confirmedRequirements =
      confirmedRequirements;

    await emergencyRequest.save();

    return res.status(200).json({
      success: true,
      message:
        'Emergency requirements updated successfully',
      data: emergencyRequest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Emergency Request
 * DELETE /api/emergency/:id
 */
export const cancelEmergencyRequest = async (
  req,
  res,
  next
) => {
  try {
    const ambulanceId = req.user?._id;

    if (!ambulanceId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated ambulance ID is missing',
      });
    }

    const { id } = req.params;

    const emergencyRequest =
      await EmergencyRequest.findById(id);

    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found',
      });
    }

    // Verify ownership
    if (
      emergencyRequest.ambulanceId.toString() !==
      ambulanceId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to cancel this emergency request',
      });
    }

    // Only active/cancellable states
    const cancellableStatuses = [
      'PARSED',
      'SEARCHING_HOSPITAL',
      'HOSPITALS_PINGED',
    ];

    if (
      !cancellableStatuses.includes(
        emergencyRequest.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This emergency request can no longer be cancelled',
      });
    }

    // Cancel emergency
    emergencyRequest.status = 'CANCELLED';

    await emergencyRequest.save();

    // Find all pending hospital requests first
    const pendingHospitalRequests =
      await HospitalEmergencyRequest.find({
        emergencyId: emergencyRequest._id,
        status: 'PENDING',
      })
        .select('_id hospitalId')
        .populate({
          path: 'hospitalId',
          select: 'id',
        });

    // Cancel all pending hospital requests
    await HospitalEmergencyRequest.updateMany(
      {
        emergencyId: emergencyRequest._id,
        status: 'PENDING',
      },
      {
        $set: {
          status: 'CANCELLED',
          respondedAt: new Date(),
        },
      }
    );

    // Notify affected hospitals in real time
    const io = getIO();

    for (const hospitalRequest of pendingHospitalRequests) {
      io.to(`hospital:${hospitalRequest.hospitalId.id}`).emit(
        'emergency:cancelled',
        {
          emergencyId: emergencyRequest.id,
          hospitalRequestId: hospitalRequest._id.toString(),
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        'Emergency request cancelled successfully',
      data: emergencyRequest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm Emergency Request
 *
 * POST /api/emergency/:id/confirm
 */
export const confirmEmergencyRequest = async (
  req,
  res,
  next
) => {
  try {
    // ----------------------------------
    // 1. Get authenticated ambulance
    // ----------------------------------

    const ambulanceId =
      req.user?._id;

    if (!ambulanceId) {
      return res.status(401).json({
        success: false,
        message:
          'Authenticated ambulance ID is missing',
      });
    }

    // ----------------------------------
    // 2. Get emergency ID
    // ----------------------------------

    const { id } = req.params;

    // ----------------------------------
    // 3. Find emergency
    // ----------------------------------

    const emergencyRequest =
      await EmergencyRequest.findById(id);

    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message:
          'Emergency request not found',
      });
    }

    // ----------------------------------
    // 4. Verify ownership
    // ----------------------------------

    if (
      emergencyRequest.ambulanceId.toString() !==
      ambulanceId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to confirm this emergency request',
      });
    }

    // ----------------------------------
    // 5. Check status
    // ----------------------------------

    if (
      emergencyRequest.status !==
      'PARSED'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Only parsed emergency requests can be confirmed',
      });
    }

    // ----------------------------------
    // 6. Check confirmed requirements
    // ----------------------------------

    if (
      !emergencyRequest.confirmedRequirements
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Confirmed emergency requirements are missing',
      });
    }

    // ----------------------------------
    // 7. Change status
    // ----------------------------------

    emergencyRequest.status =
      'SEARCHING_HOSPITAL';

    await emergencyRequest.save();

    // ----------------------------------
    // 8. Start hospital matching
    // ----------------------------------

    const matchingResult =
      await createHospitalBatch(
        emergencyRequest,
        1
      );

    // ----------------------------------
    // 9. No suitable hospital
    // ----------------------------------

    if (!matchingResult.success) {
      // Return emergency to CONFIRMED
      // because matching did not find
      // any suitable hospital yet.

      emergencyRequest.status =
        'CONFIRMED';

      await emergencyRequest.save();

      return res.status(404).json({
        success: false,
        message:
          matchingResult.message,
        data: {
          emergency:
            emergencyRequest.toJSON(),
        },
      });
    }

    // ----------------------------------
    // 10. Hospitals successfully pinged
    // ----------------------------------

    emergencyRequest.status =
      'HOSPITALS_PINGED';

    await emergencyRequest.save();

    // ----------------------------------
    // 11. Response
    // ----------------------------------

    return res.status(200).json({
      success: true,

      message:
        'Emergency confirmed and hospitals have been pinged',

      data: {
        emergency:
          emergencyRequest.toJSON(),

        hospitals:
          matchingResult.selectedHospitals,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveEmergencyRequest =
  async (req, res, next) => {

    try {

      const emergency =
        await EmergencyRequest
          .findOne({
            ambulanceId: req.user._id,

            status: {
              $in: [
                "PARSED",
                "SEARCHING_HOSPITAL",
                "HOSPITALS_PINGED",
                "HOSPITAL_ASSIGNED"
              ]
            }
          })
          .sort({
            createdAt: -1
          })
          .populate(
            "assignedHospital",
            "id name phone address location"
          );


      if (!emergency) {

        return res.status(200).json({
          success: true,
          data: null
        });
      }


      return res.status(200).json({
        success: true,
        data: emergency
      });

    } catch (error) {

      next(error);
    }
  };