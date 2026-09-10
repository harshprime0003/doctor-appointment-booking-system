import { Router } from 'express';
import { createReview } from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { createReviewSchema } from '../utils/validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.post('/', authenticate, authorize(ROLES.PATIENT), validate(createReviewSchema), createReview);

export default router;
