import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length === 2 && !isNaN(val[0]) && !isNaN(val[1]);
        },
        message: 'Coordinates must be an array of two numbers: [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const resourcesSchema = new mongoose.Schema(
  {
    icuBeds: {
      type: Number,
      default: 0,
      min: [0, 'icuBeds cannot be negative']
    },
    traumaBeds: {
      type: Number,
      default: 0,
      min: [0, 'traumaBeds cannot be negative']
    },
    generalBeds: {
      type: Number,
      default: 0,
      min: [0, 'generalBeds cannot be negative']
    },
    ventilators: {
      type: Number,
      default: 0,
      min: [0, 'ventilators cannot be negative']
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
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    location: {
      type: pointSchema,
      required: [true, 'Location is required']
    },
    resources: {
      type: resourcesSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index on location for geospatial queries
hospitalSchema.index({ location: '2dsphere' });

// Ensure password is never included in JSON output
hospitalSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
