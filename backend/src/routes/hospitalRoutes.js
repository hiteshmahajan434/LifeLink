import { Router } from 'express';
import {
  registerHospital,
  loginHospital,
  getHospitalProfile
} from '../controllers/hospitalController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerHospital);
router.post('/login', loginHospital);
router.get('/me', authenticate, requireRole('HOSPITAL'), getHospitalProfile);

export default router;
