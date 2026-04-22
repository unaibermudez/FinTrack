import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);

export default router;
