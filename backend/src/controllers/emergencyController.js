import EmergencyRequest from '../models/EmergencyRequest.js';
import { generateEmergencyId } from '../utils/counterService.js';
import { parseEmergencyRequirements } from '../services/aiParserService.js';

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