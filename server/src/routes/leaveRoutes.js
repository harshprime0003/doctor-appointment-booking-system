import { Router } from 'express';
import * as ctrl from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { leaveSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.listLeaves);
router.post('/', authorize(ROLES.DOCTOR), validate(leaveSchema), ctrl.requestLeave);
router.patch('/:id/decision', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), ctrl.decideLeave);

export default router;
