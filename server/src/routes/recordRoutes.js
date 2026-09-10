import { Router } from 'express';
import * as ctrl from '../controllers/recordController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadDocument } from '../middleware/upload.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.listRecords);
router.post('/', authorize(ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.ADMIN), uploadDocument.single('file'), ctrl.uploadRecord);
router.patch('/:id', ctrl.updateRecord);
router.delete('/:id', ctrl.deleteRecord);

export default router;
