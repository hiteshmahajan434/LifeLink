import Groq from 'groq-sdk';

export const ALLOWED_EMERGENCY_TYPES = [
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

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

/* ---------------------------------- */
/* AI Output Schema                   */
/* ---------------------------------- */

const emergencyRequirementsSchema = {
  type: 'object',

  properties: {
    description: {
      type: 'string'
    },

    emergencyType: {
      type: 'string',
      enum: ALLOWED_EMERGENCY_TYPES
    },

    patients: {
      type: 'array',
      items: {
        type: 'object',

        properties: {
          name: {
            type: ['string', 'null']
          },

          age: {
            type: ['number', 'null']
          },

          gender: {
            type: ['string', 'null']
          }
        },

        required: ['name', 'age', 'gender'],
        additionalProperties: false
      }
    },

    requiredResources: {
      type: 'object',

      properties: {
        icuBeds: {
          type: 'number',
          minimum: 0
        },

        traumaBeds: {
          type: 'number',
          minimum: 0
        },

        generalBeds: {
          type: 'number',
          minimum: 0
        },

        ventilators: {
          type: 'number',
          minimum: 0
        },

        oxygenSupply: {
          type: 'boolean'
        },

        bloodBank: {
          type: 'boolean'
        }
      },

      required: [
        'icuBeds',
        'traumaBeds',
        'generalBeds',
        'ventilators',
        'oxygenSupply',
        'bloodBank'
      ],

      additionalProperties: false
    }
  },

  required: [
    'description',
    'emergencyType',
    'patients',
    'requiredResources'
  ],

  additionalProperties: false
};

/* ---------------------------------- */
/* Validate AI Output                 */
/* ---------------------------------- */

/**
 * Validates and sanitizes the structured
 * response returned by Groq.
 *
 * @param {Object} parsed
 * @param {Object} inputs
 * @returns {Object}
 */
export const validateAndSanitizeAiOutput = (
  parsed,
  inputs = {}
) => {
  // ----------------------------------
  // Basic object validation
  // ----------------------------------

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    const error = new Error(
      'Invalid AI response structure'
    );

    error.statusCode = 502;

    throw error;
  }

  // ----------------------------------
  // Reject patientCount
  // ----------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      parsed,
      'patientCount'
    )
  ) {
    const error = new Error(
      'Invalid AI response: patientCount is not allowed'
    );

    error.statusCode = 502;

    throw error;
  }

  // ----------------------------------
  // Description
  // ----------------------------------

  if (
    typeof parsed.description !== 'string' ||
    !parsed.description.trim()
  ) {
    const error = new Error(
      'Invalid AI response: description is required'
    );

    error.statusCode = 502;

    throw error;
  }

  const description = parsed.description.trim();

  // ----------------------------------
  // Emergency Type
  // ----------------------------------

  let emergencyType = null;

  if (
    typeof parsed.emergencyType === 'string' &&
    ALLOWED_EMERGENCY_TYPES.includes(
      parsed.emergencyType.trim()
    )
  ) {
    emergencyType = parsed.emergencyType.trim();
  }

  /*
   * If AI cannot determine the emergency type,
   * use quickSelect as the explicit user input.
   */
  if (!emergencyType) {
    const quickSelectType =
      inputs.quickSelect?.emergencyType;

    if (
      typeof quickSelectType === 'string' &&
      ALLOWED_EMERGENCY_TYPES.includes(
        quickSelectType.trim()
      )
    ) {
      emergencyType = quickSelectType.trim();
    } else {
      emergencyType = 'OTHER';
    }
  }

  // ----------------------------------
  // Patients
  // ----------------------------------

  if (!Array.isArray(parsed.patients)) {
    const error = new Error(
      'Invalid AI response: patients must be an array'
    );

    error.statusCode = 502;

    throw error;
  }

  const sanitizedPatients = parsed.patients.map(
    (patient, index) => {
      if (
        !patient ||
        typeof patient !== 'object' ||
        Array.isArray(patient)
      ) {
        const error = new Error(
          `Invalid AI response: patient at index ${index} is invalid`
        );

        error.statusCode = 502;

        throw error;
      }

      // Name
      let name = null;

      if (patient.name !== null) {
        if (typeof patient.name !== 'string') {
          const error = new Error(
            `Invalid AI response: patient name at index ${index} must be a string or null`
          );

          error.statusCode = 502;

          throw error;
        }

        if (patient.name.trim()) {
          name = patient.name.trim();
        }
      }

      // Age
      let age = null;

      if (patient.age !== null) {
        if (
          typeof patient.age !== 'number' ||
          !Number.isFinite(patient.age) ||
          patient.age < 0
        ) {
          const error = new Error(
            `Invalid AI response: patient age at index ${index} must be a non-negative number or null`
          );

          error.statusCode = 502;

          throw error;
        }

        age = patient.age;
      }

      // Gender
      let gender = null;

      if (patient.gender !== null) {
        if (typeof patient.gender !== 'string') {
          const error = new Error(
            `Invalid AI response: patient gender at index ${index} must be a string or null`
          );

          error.statusCode = 502;

          throw error;
        }

        if (patient.gender.trim()) {
          gender = patient.gender.trim();
        }
      }

      return {
        name,
        age,
        gender
      };
    }
  );

  // ----------------------------------
  // Required Resources
  // ----------------------------------

  if (
    !parsed.requiredResources ||
    typeof parsed.requiredResources !== 'object' ||
    Array.isArray(parsed.requiredResources)
  ) {
    const error = new Error(
      'Invalid AI response: requiredResources is required'
    );

    error.statusCode = 502;

    throw error;
  }

  const resources = parsed.requiredResources;

  const resourceNumbers = [
    'icuBeds',
    'traumaBeds',
    'generalBeds',
    'ventilators'
  ];

  for (const field of resourceNumbers) {
    if (
      typeof resources[field] !== 'number' ||
      !Number.isFinite(resources[field]) ||
      resources[field] < 0
    ) {
      const error = new Error(
        `Invalid AI response: ${field} must be a number >= 0`
      );

      error.statusCode = 502;

      throw error;
    }
  }

  const resourceBooleans = [
    'oxygenSupply',
    'bloodBank'
  ];

  for (const field of resourceBooleans) {
    if (typeof resources[field] !== 'boolean') {
      const error = new Error(
        `Invalid AI response: ${field} must be a boolean`
      );

      error.statusCode = 502;

      throw error;
    }
  }

  const requiredResources = {
    icuBeds: Math.floor(resources.icuBeds),
    traumaBeds: Math.floor(resources.traumaBeds),
    generalBeds: Math.floor(resources.generalBeds),
    ventilators: Math.floor(resources.ventilators),
    oxygenSupply: resources.oxygenSupply,
    bloodBank: resources.bloodBank
  };

  // ----------------------------------
  // Final sanitized result
  // ----------------------------------

  return {
    description,
    emergencyType,
    patients: sanitizedPatients,
    requiredResources
  };
};

/* ---------------------------------- */
/* Groq Parser                       */
/* ---------------------------------- */

/**
 * Parses emergency inputs using Groq AI.
 *
 * @param {Object} inputs
 * @returns {Promise<Object>}
 */
export const parseEmergencyRequirements = async (
  inputs
) => {
  // ----------------------------------
  // Validate API key
  // ----------------------------------

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const error = new Error(
      'GROQ_API_KEY is not configured in environment variables'
    );

    error.statusCode = 500;

    throw error;
  }

  // ----------------------------------
  // Select model
  // ----------------------------------

  const model =
    process.env.GROQ_MODEL ||
    DEFAULT_GROQ_MODEL;

  // ----------------------------------
  // Create Groq client
  // ----------------------------------

  const groq = new Groq({
    apiKey
  });

  // ----------------------------------
  // Prepare input
  // ----------------------------------

  const inputData = {
    text: inputs?.text || null,

    voiceTranscript:
      inputs?.voiceTranscript || null,

    quickSelect:
      inputs?.quickSelect || null
  };

  // ----------------------------------
  // System Prompt
  // ----------------------------------

  const systemPrompt = `
You are an emergency information structuring assistant
for an ambulance emergency response system.

Your task is to convert the available ambulance driver
input into structured emergency requirements for hospitals.

The input may contain:

- text
- voiceTranscript
- quickSelect

Any of these may be missing.

IMPORTANT RULES:

1. Do not invent information.

2. Extract patient information only when supported
   by the provided text or voice transcript.

3. If a patient's name, age, or gender is unavailable,
   return null for that field.

4. If the input clearly states that N patients are involved
   but individual details are unavailable, create N patient
   objects with null fields.

5. If no patient count can reasonably be determined,
   return an empty patients array.

6. Never return patientCount.

7. Patient count is always patients.length.

8. emergencyType must be exactly one of:

   ROAD_ACCIDENT
   CARDIAC_EMERGENCY
   BREATHING_EMERGENCY
   STROKE
   SEVERE_INJURY
   BURN
   POISONING
   PREGNANCY
   UNCONSCIOUS
   OTHER

9. If the emergency type cannot be determined,
   return OTHER.

10. Generate a concise and useful emergency description
    for hospital staff.

11. Do not simply copy the raw voice transcript.

12. Do not include AI commentary or explanations.

13. requiredResources must contain exactly:

    icuBeds
    traumaBeds
    generalBeds
    ventilators
    oxygenSupply
    bloodBank

14. Numeric resource values must be >= 0.

15. oxygenSupply and bloodBank must be booleans.

16. quickSelect represents explicit information selected
    by the ambulance driver.

17. When quickSelect is available, treat its values as
    explicit requirements.

18. Combine information from text, voiceTranscript and
    quickSelect when multiple sources are available.

19. Do not invent resource requirements that are not
    supported by the provided information.

20. Return only the structured object matching the schema.
`;

  // ----------------------------------
  // User Input
  // ----------------------------------

  const userPrompt = `
Parse the following emergency information.

INPUT:

${JSON.stringify(inputData, null, 2)}

Return only the structured emergency requirements.
`;

  try {
    // ----------------------------------
    // Groq API Call
    // ----------------------------------

    const completion =
      await groq.chat.completions.create({
        model,

        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],

        response_format: {
          type: 'json_schema',

          json_schema: {
            name: 'emergency_requirements',

            strict: true,

            schema:
              emergencyRequirementsSchema
          }
        },

        temperature: 0.1
      });

    // ----------------------------------
    // Read AI response
    // ----------------------------------

    const rawContent =
      completion.choices?.[0]?.message?.content;

    if (!rawContent) {
      const error = new Error(
        'Groq returned an empty response'
      );

      error.statusCode = 502;

      throw error;
    }

    // ----------------------------------
    // Parse JSON
    // ----------------------------------

    let parsed;

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const error = new Error(
        'Failed to parse Groq response as JSON'
      );

      error.statusCode = 502;

      throw error;
    }

    // ----------------------------------
    // Validate AI output
    // ----------------------------------

    return validateAndSanitizeAiOutput(
      parsed,
      inputs
    );
  } catch (error) {
    /*
     * Preserve our own statusCode when we
     * intentionally created an application error.
     */

    if (error.statusCode) {
      throw error;
    }

    console.error(
      'Groq emergency parsing failed:',
      error.message
    );

    const aiError = new Error(
      'Failed to parse emergency requirements using AI'
    );

    aiError.statusCode = 502;

    throw aiError;
  }
};