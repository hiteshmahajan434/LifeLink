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

const ambulanceSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true
    },
    currentLocation: {
      type: pointSchema,
      required: [true, 'Current location is required']
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index on currentLocation for geospatial queries
ambulanceSchema.index({ currentLocation: '2dsphere' });

// Ensure password is never included in JSON output
ambulanceSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);

export default Ambulance;
