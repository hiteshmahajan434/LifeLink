import mongoose from 'mongoose';
import { initCounters } from '../utils/counterService.js';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log("MongoDB Database Connected");

    // Safely initialize counters for ambulance and hospital if not already initialized
    await initCounters();

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};
