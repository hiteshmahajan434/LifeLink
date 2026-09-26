import { Router } from 'express';
import { cancelEmergencyRequest, confirmEmergencyRequest, createEmergencyRequest, updateEmergencyRequest } from '../controllers/emergencyController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/emergency - Protected: AMBULANCE only
router.post('/', authenticate, requireRole('AMBULANCE'), createEmergencyRequest);
//PUT /api/emergency/:id 
router.put('/:id', authenticate, requireRole('AMBULANCE'), updateEmergencyRequest);
//DELETE /api/emergency/:id
router.delete('/:id', authenticate, requireRole('AMBULANCE'), cancelEmergencyRequest);
//POST /api/emergency/:id/confirm - For emergency request confirmation
router.post('/:id/confirm', authenticate, requireRole('AMBULANCE'), confirmEmergencyRequest);

export default router;
