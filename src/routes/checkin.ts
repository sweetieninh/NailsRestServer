import { Router } from 'express';
import { checkinController } from '../controllers/checkinController';
import { validateRequest } from '../middleware/validateRequest';
import { createCheckinValidator, lookupValidator } from '../validators/checkinValidator';

const router = Router();

router.post('/lookup', validateRequest(lookupValidator), checkinController.lookup);
router.post('/', validateRequest(createCheckinValidator), checkinController.create);

export default router;
