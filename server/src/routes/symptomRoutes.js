import { Router } from 'express';
import { checkSymptoms, recommendDoctors } from '../controllers/symptomController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { symptomSchema, recommendSchema } from '../utils/validators.js';

const router = Router();

router.post('/check', validate(symptomSchema), checkSymptoms);
router.post('/recommend', authenticate, validate(recommendSchema), recommendDoctors);

export default router;
