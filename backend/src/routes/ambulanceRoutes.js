import { Router } from 'express';
import {
  registerAmbulance,
  loginAmbulance,
  getAmbulanceProfile
} from '../controllers/ambulanceController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerAmbulance);
router.post('/login', loginAmbulance);
router.get('/me', authenticate, requireRole('AMBULANCE'), getAmbulanceProfile);

export default router;
