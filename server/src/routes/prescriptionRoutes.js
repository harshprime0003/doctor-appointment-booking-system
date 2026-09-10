import { Router } from 'express';
import * as ctrl from '../controllers/prescriptionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { createPrescriptionSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.listPrescriptions);
router.post('/', authorize(ROLES.DOCTOR), validate(createPrescriptionSchema), ctrl.createPrescription);
router.get('/:id', ctrl.getPrescription);

export default router;
