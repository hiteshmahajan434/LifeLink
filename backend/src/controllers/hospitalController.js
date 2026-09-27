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

/**
 * Update Authenticated Hospital Profile
 * PATCH /api/hospital/profile
 */
export const updateHospitalProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.user._id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital profile not found'
      });
    }

    const {
      name,
      email,
      phone,
      address,
      location
    } = req.body;

    // At least one field must be provided
    if (
      name === undefined &&
      email === undefined &&
      phone === undefined &&
      address === undefined &&
      location === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one profile field is required'
      });
    }

    // Name
    if (name !== undefined) {
      if (
        typeof name !== 'string' ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string'
        });
      }

      hospital.name = name.trim();
    }

    // Email
    if (email !== undefined) {
      if (
        typeof email !== 'string' ||
        !EMAIL_REGEX.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingHospital = await Hospital.findOne({
        email: normalizedEmail,
        _id: { $ne: hospital._id }
      });

      if (existingHospital) {
        return res.status(409).json({
          success: false,
          message: 'A hospital with this email already exists'
        });
      }

      hospital.email = normalizedEmail;
    }

    // Phone
    if (phone !== undefined) {
      if (
        typeof phone !== 'string' ||
        !phone.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be a non-empty string'
        });
      }

      hospital.phone = phone.trim();
    }

    // Address
    if (address !== undefined) {
      if (
        typeof address !== 'string' ||
        !address.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Address must be a non-empty string'
        });
      }

      hospital.address = address.trim();
    }

    // Location
    if (location !== undefined) {
      if (!isValidGeoJsonPoint(location)) {
        return res.status(400).json({
          success: false,
          message:
            'location must be a valid GeoJSON Point with [longitude, latitude] coordinates'
        });
      }

      hospital.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    await hospital.save();

    return res.status(200).json({
      success: true,
      message: 'Hospital profile updated successfully',
      data: hospital.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change Hospital Password
 * PATCH /api/hospital/password
 */
export const changeHospitalPassword = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.user._id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital profile not found'
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      hospital.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    hospital.password = await hashPassword(newPassword);

    await hospital.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyHospitals = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10000 } = req.query;

    const lat = Number(latitude);
    const lng = Number(longitude);
    const maxDistance = Number(radius);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    next(error);
  }
};