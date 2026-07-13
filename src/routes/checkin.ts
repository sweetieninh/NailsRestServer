import { Router } from 'express';
import { checkinController } from '../controllers/checkinController';
import { validateRequest } from '../middleware/validateRequest';
import {
	checkoutValidator,
	createCheckinValidator,
	lookupValidator,
	saveCartValidator,
	staffAuthValidator,
} from '../validators/checkinValidator';

const router = Router();

router.post('/lookup', validateRequest(lookupValidator), checkinController.lookup);
router.post('/', validateRequest(createCheckinValidator), checkinController.create);
router.post('/staff/auth', validateRequest(staffAuthValidator), checkinController.staffAuth);
router.post('/manager/auth', validateRequest(staffAuthValidator), checkinController.managerAuth);
router.get('/today', checkinController.todayCheckins);
router.get('/technicians', checkinController.technicians);
router.get('/inventory', checkinController.inventory);
router.get('/service-types', checkinController.serviceTypes);
router.get('/cart', checkinController.getCart);
router.post('/cart/save', validateRequest(saveCartValidator), checkinController.saveCart);
router.post('/checkout', validateRequest(checkoutValidator), checkinController.checkout);
router.get('/reports/store', checkinController.storeReport);

export default router;
