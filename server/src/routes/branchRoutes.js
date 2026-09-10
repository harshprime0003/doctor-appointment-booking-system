import { Router } from 'express';
import * as ctrl from '../controllers/branchController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { branchSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.get('/', ctrl.listBranches);
router.post('/', authenticate, authorize(ROLES.ADMIN), validate(branchSchema), ctrl.createBranch);
router.patch('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.updateBranch);

export default router;
