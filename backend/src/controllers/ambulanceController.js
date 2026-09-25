import Ambulance from '../models/Ambulance.js';
import { generateAmbulanceId } from '../utils/counterService.js';
import { hashPassword, comparePassword } from '../utils/passwordService.js';
import { signToken } from '../utils/jwtService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates GeoJSON Point
 */
const isValidGeoJsonPoint = (location) => {
  return (
    location &&
    location.type === 'Point' &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    typeof location.coordinates[0] === 'number' &&
    !isNaN(location.coordinates[0]) &&
    typeof location.coordinates[1] === 'number' &&
    !isNaN(location.coordinates[1])
  );
};

/**
 * Register Ambulance
 * POST /api/ambulance/register
 */
export const registerAmbulance = async (req, res, next) => {
  try {
    const { name, email, password, mobile, hospitalName, currentLocation } = req.body;

    // Validate required fields
    if (!name || !email || !password || !mobile || !hospitalName || !currentLocation) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, mobile, hospitalName, currentLocation'
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password minimum length
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate GeoJSON Point structure
    if (!isValidGeoJsonPoint(currentLocation)) {
      return res.status(400).json({
        success: false,
        message: 'currentLocation must be a valid GeoJSON Point with [longitude, latitude] coordinates'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await Ambulance.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An ambulance with this email already exists'
      });
    }

    // Atomically generate Ambulance ID (AMB-100, AMB-101, etc.)
    const id = await generateAmbulanceId();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create ambulance
    const ambulance = await Ambulance.create({
      id,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      mobile: mobile.trim(),
      hospitalName: hospitalName.trim(),
      currentLocation: {
        type: 'Point',
        coordinates: currentLocation.coordinates
      }
    });

    // Generate JWT with Mongoose document _id
    const token = signToken({ _id: ambulance._id, id: ambulance.id, role: 'AMBULANCE' });

    // Automatic login: return 201 with token and safe entity
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: ambulance.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login Ambulance
 * POST /api/ambulance/login
 */
export const loginAmbulance = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (email or Ambulance ID) and password are required'
      });
    }

    const trimmedIdentifier = identifier.trim();

    // Allow login by email or generated ID (case-insensitive for email, uppercase match for ID)
    const ambulance = await Ambulance.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { id: trimmedIdentifier.toUpperCase() }
      ]
    });

    if (!ambulance) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, ambulance.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT with Mongoose document _id
    const token = signToken({ _id: ambulance._id, id: ambulance.id, role: 'AMBULANCE' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: ambulance.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated Ambulance Profile
 * GET /api/ambulance/me
 */
export const getAmbulanceProfile = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.user._id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: ambulance.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
