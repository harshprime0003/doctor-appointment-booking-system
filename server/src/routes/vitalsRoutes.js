import { Router } from 'express';
import * as ctrl from '../controllers/vitalsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.listVitals);
router.post('/', authorize(ROLES.PATIENT), ctrl.addVitals);
router.delete('/:id', authorize(ROLES.PATIENT), ctrl.deleteVitals);

export default router;
