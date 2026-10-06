import mongoose from 'mongoose';

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

/* ---------------------------------- */
/* GeoJSON Point                      */
/* ---------------------------------- */

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },

    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (val) {
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            typeof val[0] === 'number' &&
            Number.isFinite(val[0]) &&
            val[0] >= -180 &&
            val[0] <= 180 &&
            typeof val[1] === 'number' &&
            Number.isFinite(val[1]) &&
            val[1] >= -90 &&
            val[1] <= 90
          );
        },
        message:
          'Coordinates must be [longitude (-180 to 180), latitude (-90 to 90)]'
      }
    }
  },
  { _id: false }
);

/* ---------------------------------- */
/* Resources                          */
/* ---------------------------------- */

const resourcesSchema = new mongoose.Schema(
  {
    icuBeds: {
      type: Number,
      required: true,
      min: [0, 'icuBeds cannot be negative']
    },

    traumaBeds: {
      type: Number,
      required: true,
      min: [0, 'traumaBeds cannot be negative']
    },

    generalBeds: {
      type: Number,
      required: true,
      min: [0, 'generalBeds cannot be negative']
    },

    ventilators: {
      type: Number,
      required: true,
      min: [0, 'ventilators cannot be negative']
    },

    oxygenSupply: {
      type: Boolean,
      required: true
    },

    bloodBank: {
      type: Boolean,
      required: true
    }
  },
  { _id: false }
);

/* ---------------------------------- */
/* Quick Select                       */
/* ---------------------------------- */

const quickSelectSchema = new mongoose.Schema(
  {
    emergencyType: {
      type: String,
      enum: EMERGENCY_TYPES,
      required: [true, 'emergencyType is required'],
      trim: true
    },

    requiredResources: {
      type: resourcesSchema,
      required: [true, 'requiredResources is required']
    }
  },
  { _id: false }
);

/* ---------------------------------- */
/* Raw Frontend Inputs                */
/* ---------------------------------- */

const inputsSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: null,
      trim: true
    },

    voiceTranscript: {
      type: String,
      default: null,
      trim: true
    },

    quickSelect: {
      type: quickSelectSchema,
      default: null
    }
  },
  { _id: false }
);

/* ---------------------------------- */
/* Patient                            */
/* ---------------------------------- */

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null,
      trim: true
    },

    age: {
      type: Number,
      default: null,
      min: [0, 'Patient age cannot be negative']
    },

    gender: {
      type: String,
      default: null,
      trim: true
    }
  },
  { _id: false }
);

/* ---------------------------------- */
/* AI Parsed Requirements             */
/* ---------------------------------- */

const parsedRequirementsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'AI parsed description is required'],
      trim: true
    },

    emergencyType: {
      type: String,
      enum: EMERGENCY_TYPES,
      required: [true, 'AI parsed emergencyType is required'],
      trim: true
    },

    patients: {
      type: [patientSchema],
      required: true,
      default: []
    },

    requiredResources: {
      type: resourcesSchema,
      required: [true, 'AI parsed requiredResources is required']
    }
  },
  { _id: false }
);

/* ---------------------------------- */
/* Emergency Request                  */
/* ---------------------------------- */

const emergencyRequestSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
      required: true,
    },

    location: {
      type: pointSchema,
      required: [true, 'Location is required']
    },

    inputs: {
      type: inputsSchema,
      required: [true, 'inputs is required']
    },

    aiParsedRequirements: {
      type: parsedRequirementsSchema,
      required: [true, 'AI parsed requirements are required']
    },

    confirmedRequirements: {
      type: parsedRequirementsSchema,
      default: null
    },

    status: {
      type: String,
      enum: [
        'PARSED',
        'CANCELLED',
        'CONFIRMED',
        'SEARCHING_HOSPITAL',
        'HOSPITALS_PINGED',
        'HOSPITAL_ASSIGNED',
        'NO_HOSPITAL_AVAILABLE',
        'COMPLETED'
      ],
      default: 'PARSED',
      required: true
    },

    assignedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null
    },

    handover: {
      status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING'
      },

      type: {
        type: String,
        enum: ['ARRIVED', 'ANYWAY'],
        default: null
      },

      completedAt: {
        type: Date,
        default: null
      }
    },
  },
  {
    timestamps: true
  }
);

/* ---------------------------------- */
/* GeoSpatial Index                   */
/* ---------------------------------- */

emergencyRequestSchema.index({ location: '2dsphere' });

/* ---------------------------------- */
/* JSON Response                      */
/* ---------------------------------- */

emergencyRequestSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;

    return ret;
  }
});

const EmergencyRequest = mongoose.model(
  'EmergencyRequest',
  emergencyRequestSchema
);

export default EmergencyRequest;