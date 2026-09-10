import { Router } from 'express';
import { quote, getInvoice, myPayments } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/quote', quote);
router.get('/mine', myPayments);
router.get('/invoice/:id', getInvoice);

export default router;
