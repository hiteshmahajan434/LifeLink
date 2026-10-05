import { Router } from 'express';

import {
  cancelEmergencyRequest,
  confirmEmergencyRequest,
  createEmergencyRequest,
  updateEmergencyRequest,
  getActiveEmergencyRequest
} from '../controllers/emergencyController.js';

import {
  completeHandover
} from '../controllers/handoverController.js';

import {
  authenticate,
  requireRole
} from '../middleware/authMiddleware.js';


const router = Router();


// POST /api/emergency
// Protected: AMBULANCE only

router.post(
  '/',
  authenticate,
  requireRole('AMBULANCE'),
  createEmergencyRequest
);

router.get(
  "/active",
  authenticate,
  requireRole("AMBULANCE"),
  getActiveEmergencyRequest
);

// PUT /api/emergency/:id

router.put(
  '/:id',
  authenticate,
  requireRole('AMBULANCE'),
  updateEmergencyRequest
);


// DELETE /api/emergency/:id

router.delete(
  '/:id',
  authenticate,
  requireRole('AMBULANCE'),
  cancelEmergencyRequest
);


// POST /api/emergency/:id/confirm
// Confirm emergency and start hospital matching

router.post(
  '/:id/confirm',
  authenticate,
  requireRole('AMBULANCE'),
  confirmEmergencyRequest
);


// POST /api/emergency/:id/handover
// Complete hospital handover
// Protected: AMBULANCE only

router.post(
  '/:id/handover',
  authenticate,
  requireRole('AMBULANCE'),
  completeHandover
);

export default router;