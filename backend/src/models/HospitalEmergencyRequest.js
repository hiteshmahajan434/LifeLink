import mongoose from 'mongoose';

const hospitalEmergencyRequestSchema = new mongoose.Schema(
  {
    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyRequest',
      required: true
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED'
      ],
      default: 'PENDING'
    },

    batchNumber: {
      type: Number,
      required: true,
      min: 1
    },

    sentAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      required: true
    },

    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Quickly find pending requests for a hospital
hospitalEmergencyRequestSchema.index({
  hospitalId: 1,
  status: 1
});

// Quickly find all hospital requests belonging to an emergency
hospitalEmergencyRequestSchema.index({
  emergencyId: 1
});

hospitalEmergencyRequestSchema.index({
  status: 1,
  expiresAt: 1
});

const HospitalEmergencyRequest = mongoose.model(
  'HospitalEmergencyRequest',
  hospitalEmergencyRequestSchema
);

export default HospitalEmergencyRequest;