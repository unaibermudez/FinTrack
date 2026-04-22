import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getAssetPrice } from '../controllers/assetController.js';

const router = Router();
router.use(authenticate);

router.get('/price/:symbol', getAssetPrice);

export default router;
