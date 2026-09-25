import { Router } from 'express';
import { createEmergencyRequest } from '../controllers/emergencyController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/emergency - Protected: AMBULANCE only
router.post('/', authenticate, requireRole('AMBULANCE'), createEmergencyRequest);

export default router;
