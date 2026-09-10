import { Router } from 'express';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import adminRoutes from './adminRoutes.js';
import symptomRoutes from './symptomRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import recordRoutes from './recordRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import branchRoutes from './branchRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import patientRoutes from './patientRoutes.js';
import vitalsRoutes from './vitalsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import { dashboard } from '../controllers/dashboardController.js';
import { meta } from '../controllers/metaController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/meta', meta);
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/symptom', symptomRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/records', recordRoutes);
router.use('/leaves', leaveRoutes);
router.use('/branches', branchRoutes);
router.use('/payments', paymentRoutes);
router.use('/patients', patientRoutes);
router.use('/vitals', vitalsRoutes);
router.use('/notifications', notificationRoutes);
router.get('/dashboard', authenticate, dashboard);

export default router;
