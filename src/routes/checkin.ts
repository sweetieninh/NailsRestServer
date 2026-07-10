import { Router } from 'express';
import { checkinController } from '../controllers/checkinController';
import { validateRequest } from '../middleware/validateRequest';
import {
	createCheckinValidator,
	lookupValidator,
	staffAuthValidator,
	todayCheckinsValidator,
} from '../validators/checkinValidator';

const router = Router();

router.post('/lookup', validateRequest(lookupValidator), checkinController.lookup);
router.post('/', validateRequest(createCheckinValidator), checkinController.create);
router.post('/staff/auth', validateRequest(staffAuthValidator), checkinController.staffAuth);
router.get('/today', checkinController.todayCheckins);

export default router;
