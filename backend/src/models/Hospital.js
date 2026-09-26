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
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            typeof val[0] === 'number' &&
            typeof val[1] === 'number' &&
            !isNaN(val[0]) &&
            !isNaN(val[1])
          );
        },
        message:
          'Coordinates must be an array of two numbers: [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    // Public hospital ID
    // Example: HOSP-100
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

    // Reference to HospitalResource document
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalResource',
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for nearby hospital queries
hospitalSchema.index({ location: '2dsphere' });

// Never return password in JSON
hospitalSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;