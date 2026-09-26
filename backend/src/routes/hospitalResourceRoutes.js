import { Router } from 'express';

import {
  getHospitalResources,
  updateHospitalResource
} from '../controllers/hospitalResourceController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Get all resources of logged-in hospital
router.get( '/', authenticate, requireRole('HOSPITAL'), getHospitalResources );

// Update one specific resource
router.put( '/:resourceType', authenticate, requireRole('HOSPITAL'), updateHospitalResource );

export default router;