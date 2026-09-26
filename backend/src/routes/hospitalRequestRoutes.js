import { Router } from 'express';

import {
  getHospitalRequests
} from '../controllers/hospitalRequestController.js';

import {
  authenticate,
  requireRole
} from '../middleware/authMiddleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole('HOSPITAL'),
  getHospitalRequests
);

export default router;