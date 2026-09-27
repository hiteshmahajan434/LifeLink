import { Router } from 'express';
import {
  registerHospital,
  loginHospital,
  getHospitalProfile,
  changeHospitalPassword,
  updateHospitalProfile,
  getNearbyHospitals
} from '../controllers/hospitalController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerHospital);
router.post('/login', loginHospital);
router.get('/me', authenticate, requireRole('HOSPITAL'), getHospitalProfile);
router.patch('/profile', authenticate, requireRole('HOSPITAL'), updateHospitalProfile);
router.patch('/change-password', authenticate, requireRole('HOSPITAL'), changeHospitalPassword);
router.get("/nearby", authenticate, requireRole('AMBULANCE'), getNearbyHospitals);

export default router;
