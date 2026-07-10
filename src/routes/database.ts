import { Router } from 'express';
import { dbController } from '../controllers/dbController';

const router = Router();

router.get('/getNailsDB', dbController.getNailsDBCollections);
router.get('/getNailsDB/summary', dbController.getNailsDBCollectionSummary);

export default router;
