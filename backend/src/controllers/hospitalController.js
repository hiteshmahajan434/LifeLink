import Hospital from '../models/Hospital.js';
import { generateHospitalId } from '../utils/counterService.js';
import { hashPassword, comparePassword } from '../utils/passwordService.js';
import { signToken } from '../utils/jwtService.js';
import HospitalResource from '../models/HospitalResource.js';

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
 * Validates resources structure
 */
const validateResources = (resources) => {
  if (!resources || typeof resources !== 'object' || Array.isArray(resources)) {
    return 'resources must be an object';
  }

  const numberFields = ['icuBeds', 'traumaBeds', 'generalBeds', 'ventilators'];
  for (const field of numberFields) {
    if (resources[field] !== undefined) {
      if (!Number.isInteger(resources[field]) || resources[field] < 0) {
        return `${field} must be a non-negative number`;
      }
    }
  }

  const booleanFields = ['oxygenSupply', 'bloodBank'];
  for (const field of booleanFields) {
    if (resources[field] !== undefined && typeof resources[field] !== 'boolean') {
      return `${field} must be a boolean`;
    }
  }

  return null;
};

/**
 * Register Hospital
 * POST /api/hospital/register
 */
export const registerHospital = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, location, resources } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !address || !location || resources === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, phone, address, location, resources'
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

    // Validate location GeoJSON Point
    if (!isValidGeoJsonPoint(location)) {
      return res.status(400).json({
        success: false,
        message: 'location must be a valid GeoJSON Point with [longitude, latitude] coordinates'
      });
    }

    // Validate resources
    const resourceError = validateResources(resources);
    if (resourceError) {
      return res.status(400).json({
        success: false,
        message: resourceError
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await Hospital.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A hospital with this email already exists'
      });
    }

    // Atomically generate Hospital ID (HOSP-100, HOSP-101, etc.)
    const id = await generateHospitalId();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create hospital
    const hospital = await Hospital.create({
      id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      address: address.trim(),
      location: {
        type: 'Point',
        coordinates: location.coordinates
      }
    });

    const hospitalResource = await HospitalResource.create({
      hospitalId: hospital._id,
      icuBeds: {
        total: resources.icuBeds ?? 0,
        occupied: 0,
        reserved: 0
      },
      traumaBeds: {
        total: resources.traumaBeds ?? 0,
        occupied: 0,
        reserved: 0
      },
      generalBeds: {
        total: resources.generalBeds ?? 0,
        occupied: 0,
        reserved: 0
      },
      ventilators: {
        total: resources.ventilators ?? 0,
        occupied: 0,
        reserved: 0
      },
      oxygenSupply: resources.oxygenSupply ?? false,
      bloodBank: resources.bloodBank ?? false
    });

    hospital.resourceId = hospitalResource._id;

    await hospital.save();

    // Generate JWT with Mongoose document _id
    const token = signToken({ _id: hospital._id, id: hospital.id, role: 'HOSPITAL' });

    // Automatic login: return 201 with token and safe entity
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: hospital.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login Hospital
 * POST /api/hospital/login
 */
export const loginHospital = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (email or Hospital ID) and password are required'
      });
    }

    const trimmedIdentifier = identifier.trim();

    // Allow login by email or generated ID
    const hospital = await Hospital.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { id: trimmedIdentifier.toUpperCase() }
      ]
    });

    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, hospital.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT with Mongoose document _id
    const token = signToken({ _id: hospital._id, id: hospital.id, role: 'HOSPITAL' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: hospital.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated Hospital Profile
 * GET /api/hospital/me
 */
export const getHospitalProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.user._id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: hospital.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
