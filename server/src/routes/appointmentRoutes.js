import { Router } from 'express';
import * as ctrl from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { createAppointmentSchema, updateAppointmentStatusSchema, trackSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/queue', ctrl.getQueue);
router.get('/', ctrl.listAppointments);
router.post('/', authorize(ROLES.PATIENT), validate(createAppointmentSchema), ctrl.createAppointment);
router.get('/:id', ctrl.getAppointment);
router.patch('/:id/status', validate(updateAppointmentStatusSchema), ctrl.updateAppointmentStatus);
router.patch('/:id/track', validate(trackSchema), ctrl.updateTracking);

export default router;
