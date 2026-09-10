import { Router } from 'express';
import { listPatients } from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.get('/', authenticate, authorize(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN), listPatients);

export default router;
