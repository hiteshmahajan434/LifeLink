import { Router } from 'express';
import {
  registerAmbulance,
  loginAmbulance,
  getAmbulanceProfile,
  updateAmbulanceProfile,
  changeAmbulancePassword
} from '../controllers/ambulanceController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerAmbulance);
router.post('/login', loginAmbulance);
router.get('/me', authenticate, requireRole('AMBULANCE'), getAmbulanceProfile);
router.patch('/profile', authenticate, requireRole('AMBULANCE'), updateAmbulanceProfile);
router.patch('/change-password', authenticate, requireRole('AMBULANCE'), changeAmbulancePassword);

export default router;
