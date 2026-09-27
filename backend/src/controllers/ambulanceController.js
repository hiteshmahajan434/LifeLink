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

/**
 * Update Authenticated Ambulance Profile
 * PATCH /api/ambulance/profile
 */
export const updateAmbulanceProfile = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.user._id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance profile not found'
      });
    }

    const { name, email, mobile, hospitalName } = req.body;

    // At least one field must be provided
    if (
      name === undefined &&
      email === undefined &&
      mobile === undefined &&
      hospitalName === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one profile field is required'
      });
    }

    // Validate and update name
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string'
        });
      }

      ambulance.name = name.trim();
    }

    // Validate and update email
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

      // Check whether another ambulance already uses this email
      const existingAmbulance = await Ambulance.findOne({
        email: normalizedEmail,
        _id: { $ne: ambulance._id }
      });

      if (existingAmbulance) {
        return res.status(409).json({
          success: false,
          message: 'An ambulance with this email already exists'
        });
      }

      ambulance.email = normalizedEmail;
    }

    // Validate and update mobile
    if (mobile !== undefined) {
      if (
        typeof mobile !== 'string' ||
        !mobile.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must be a non-empty string'
        });
      }

      ambulance.mobile = mobile.trim();
    }

    // Validate and update hospital name
    if (hospitalName !== undefined) {
      if (
        typeof hospitalName !== 'string' ||
        !hospitalName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Hospital name must be a non-empty string'
        });
      }

      ambulance.hospitalName = hospitalName.trim();
    }

    await ambulance.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: ambulance.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change Ambulance Password
 * PATCH /api/ambulance/change-password
 */
export const changeAmbulancePassword = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.user._id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance profile not found'
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
      ambulance.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    ambulance.password = await hashPassword(newPassword);

    await ambulance.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateAmbulanceLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must be numbers",
      });
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    const ambulance = await Ambulance.findById(req.user._id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: "Ambulance profile not found",
      });
    }

    ambulance.currentLocation = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    await ambulance.save();

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        currentLocation: ambulance.currentLocation,
      },
    });
  } catch (error) {
    next(error);
  }
};