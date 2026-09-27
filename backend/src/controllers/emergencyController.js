import EmergencyRequest from '../models/EmergencyRequest.js';
import { generateEmergencyId } from '../utils/counterService.js';
import { parseEmergencyRequirements } from '../services/aiParserService.js';
import { createHospitalBatch  } from '../services/hospitalMatchingService.js';

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
  'OTHER'
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
        message: 'Authenticated ambulance ID is missing'
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
          'patients must not be provided. Patient information is extracted by the AI parser.'
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
        message: 'inputs object is required'
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
          'At least one of text, voiceTranscript, or quickSelect is required'
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
          message: 'quickSelect must be an object'
        });
      }

      const emergencyType =
        inputs.quickSelect.emergencyType;

      // emergencyType is required INSIDE quickSelect
      // when quickSelect itself is provided.
      if (
        typeof emergencyType !== 'string' ||
        !emergencyType.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'emergencyType is required when quickSelect is provided'
        });
      }

      const normalizedEmergencyType =
        emergencyType.trim();

      // Validate enum
      if (!EMERGENCY_TYPES.includes(normalizedEmergencyType)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid emergencyType. Allowed values: ${EMERGENCY_TYPES.join(', ')}`
        });
      }

      // ----------------------------------
      // Validate requiredResources
      // ----------------------------------

      const requiredResources =
        inputs.quickSelect.requiredResources;

      if (
        !requiredResources ||
        typeof requiredResources !== 'object' ||
        Array.isArray(requiredResources)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'requiredResources is required when quickSelect is provided'
        });
      }

      const {
        icuBeds,
        traumaBeds,
        generalBeds,
        ventilators,
        oxygenSupply,
        bloodBank
      } = requiredResources;

      const isNonNegativeNumber = (value) =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0;

      if (
        !isNonNegativeNumber(icuBeds) ||
        !isNonNegativeNumber(traumaBeds) ||
        !isNonNegativeNumber(generalBeds) ||
        !isNonNegativeNumber(ventilators) ||
        typeof oxygenSupply !== 'boolean' ||
        typeof bloodBank !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid requiredResources values. Bed/ventilator counts must be numbers >= 0, and oxygenSupply and bloodBank must be booleans.'
        });
      }

      sanitizedQuickSelect = {
        emergencyType: normalizedEmergencyType,
        requiredResources: {
          icuBeds,
          traumaBeds,
          generalBeds,
          ventilators,
          oxygenSupply,
          bloodBank
        }
      };
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
          'location must be a valid GeoJSON Point with [longitude, latitude] coordinates'
      });
    }

    const [longitude, latitude] = location.coordinates;

    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Coordinates must be valid numbers: longitude between -180 and 180, latitude between -90 and 90'
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

      quickSelect: sanitizedQuickSelect
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

    const emergencyRequest = new EmergencyRequest({
      id,

      ambulanceId,

      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },

      inputs: sanitizedInputs,

      aiParsedRequirements,

      confirmedRequirements: aiParsedRequirements,

      status: 'PARSED'
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
      message: 'Emergency request parsed successfully',
      data: emergencyRequest.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Emergency Requirements
 * PUT /api/emergency/:id 
 */
export const updateEmergencyRequest = async (req, res, next) => {
  try {
    const ambulanceId = req.user?._id;

    if (!ambulanceId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated ambulance ID is missing'
      });
    }

    const { id } = req.params; // id -> mongoose _id
    const { confirmedRequirements } = req.body;

    if (!confirmedRequirements) {
      return res.status(400).json({
        success: false,
        message: 'confirmedRequirements is required'
      });
    }

    const emergencyRequest = await EmergencyRequest.findById(id);

    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    if (emergencyRequest.status !== 'PARSED') {
      return res.status(400).json({
        success: false,
        message: 'Only parsed emergency requests can be edited'
      });
    }

    emergencyRequest.confirmedRequirements = confirmedRequirements;

    await emergencyRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Emergency requirements updated successfully',
      data: emergencyRequest.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Emergency Request
 * DELETE /api/emergency/:id
 */
export const cancelEmergencyRequest = async (req, res, next) => {
  try {
    // ----------------------------------
    // 1. Get authenticated ambulance ID
    // ----------------------------------

    const ambulanceId = req.user?._id;

    if (!ambulanceId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated ambulance ID is missing'
      });
    }

    // ----------------------------------
    // 2. Get emergency MongoDB _id
    // ----------------------------------

    const { id } = req.params;

    // ----------------------------------
    // 3. Find request belonging to ambulance
    // ----------------------------------

    const emergencyRequest = await EmergencyRequest.findById( id );

    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // ----------------------------------
    // 4. Only PARSED requests can be cancelled
    // ----------------------------------

    if (emergencyRequest.status !== 'PARSED') {
      return res.status(400).json({
        success: false,
        message: 'Only parsed emergency requests can be cancelled'
      });
    }

    // ----------------------------------
    // 5. Mark request as cancelled
    // ----------------------------------

    emergencyRequest.status = 'CANCELLED';

    // ----------------------------------
    // 6. Save
    // ----------------------------------

    await emergencyRequest.save();

    // ----------------------------------
    // 7. Return updated request
    // ----------------------------------

    return res.status(200).json({
      success: true,
      message: 'Emergency request cancelled successfully',
      data: emergencyRequest.toJSON()
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
          'Authenticated ambulance ID is missing'
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
          'Emergency request not found'
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
          'You are not authorized to confirm this emergency request'
      });
    }


    // ----------------------------------
    // 5. Check status
    // ----------------------------------

    if (
      emergencyRequest.status !== 'PARSED'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Only parsed emergency requests can be confirmed'
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
          'Confirmed emergency requirements are missing'
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
      await createHospitalBatch (
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
            emergencyRequest.toJSON()
        }
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
          matchingResult.selectedHospitals
      }
    });

  } catch (error) {
    next(error);
  }
};