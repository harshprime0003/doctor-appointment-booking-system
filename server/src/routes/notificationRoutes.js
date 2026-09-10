import { Router } from 'express';
import { getNotifications, markAllRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/read-all', authenticate, markAllRead);

export default router;
