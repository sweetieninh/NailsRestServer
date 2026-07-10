import { Router } from 'express';
import healthRouter from './health';
import checkinRouter from './checkin';
import customersRouter from './customers';
import databaseRouter from './database';

const router = Router();

router.use('/health', healthRouter);
router.use('/checkin', checkinRouter);
router.use('/customers', customersRouter);
router.use('/', databaseRouter);

export default router;
