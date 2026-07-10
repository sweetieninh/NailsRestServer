import { Router } from 'express';
import { customersController } from '../controllers/customersController';
import { validateRequest } from '../middleware/validateRequest';
import { registerCustomerValidator } from '../validators/customerValidator';

const router = Router();

router.post('/register', validateRequest(registerCustomerValidator), customersController.register);

export default router;
