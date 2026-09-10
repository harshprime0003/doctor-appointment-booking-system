import { Router } from 'express';
import * as ctrl from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { uploadImage } from '../middleware/upload.js';
import { doctorProfileSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.get('/me/profile', authenticate, authorize(ROLES.DOCTOR), ctrl.getMyDoctorProfile);
router.patch('/me/profile', authenticate, authorize(ROLES.DOCTOR), validate(doctorProfileSchema), ctrl.updateMyDoctorProfile);
router.post('/me/avatar', authenticate, authorize(ROLES.DOCTOR), uploadImage.single('avatar'), ctrl.uploadAvatar);
router.get('/me/patients', authenticate, authorize(ROLES.DOCTOR), ctrl.getMyPatients);

router.get('/', ctrl.listDoctors);
router.get('/:id', ctrl.getDoctor);
router.get('/:id/slots', ctrl.getDoctorSlots);

export default router;
