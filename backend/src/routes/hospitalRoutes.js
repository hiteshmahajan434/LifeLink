import { Router } from 'express';
import {
  registerHospital,
  loginHospital,
  getHospitalProfile,
  changeHospitalPassword,
  updateHospitalProfile
} from '../controllers/hospitalController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { changeAmbulancePassword, updateAmbulanceProfile } from '../controllers/ambulanceController.js';

const router = Router();

router.post('/register', registerHospital);
router.post('/login', loginHospital);
router.get('/me', authenticate, requireRole('HOSPITAL'), getHospitalProfile);
router.patch('/profile', authenticate, requireRole('HOSPITAL'), updateHospitalProfile);
router.get('/change-password', authenticate, requireRole('HOSPITAL'), changeHospitalPassword);

export default router;
