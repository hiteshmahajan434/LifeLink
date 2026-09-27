import { Router } from 'express';

import {
  getHospitalRequests,
  acceptHospitalRequest,
  rejectHospitalRequest
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

router.post(
  '/:requestId/accept',
  authenticate,
  requireRole('HOSPITAL'),
  acceptHospitalRequest
);

router.post(
  '/:requestId/reject',
  authenticate,
  requireRole('HOSPITAL'),
  rejectHospitalRequest
);

export default router;