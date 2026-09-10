import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { adminCreateDoctorSchema, createStaffSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', ctrl.adminStats);

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/status', ctrl.updateUserStatus);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/doctors', ctrl.listAllDoctors);
router.post('/doctors', validate(adminCreateDoctorSchema), ctrl.createDoctor);
router.patch('/doctors/:id/status', ctrl.updateDoctorStatus);
router.patch('/doctors/:id', ctrl.updateDoctor);

router.post('/receptionists', validate(createStaffSchema), ctrl.createReceptionist);

router.get('/payments', ctrl.listPayments);

router.get('/audit-logs', listAuditLogs);

export default router;
