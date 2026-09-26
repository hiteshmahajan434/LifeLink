import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total resource cannot be negative']
    },

    occupied: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Occupied resource cannot be negative']
    },

    reserved: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Reserved resource cannot be negative']
    }
  },
  { _id: false }
);

const hospitalResourceSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      unique: true
    },

    icuBeds: {
      type: resourceSchema,
      default: () => ({})
    },

    traumaBeds: {
      type: resourceSchema,
      default: () => ({})
    },

    generalBeds: {
      type: resourceSchema,
      default: () => ({})
    },

    ventilators: {
      type: resourceSchema,
      default: () => ({})
    },

    oxygenSupply: {
      type: Boolean,
      default: false
    },

    bloodBank: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const HospitalResource = mongoose.model(
  'HospitalResource',
  hospitalResourceSchema
);

export default HospitalResource;