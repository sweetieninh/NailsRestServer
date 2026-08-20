import { Request, Response, NextFunction } from 'express';
import { dbService } from '../services/dbService';

export const dbController = {
  getNailsDBCollections: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collections = await dbService.getNailsDBCollections();
      console.log('[debug] NailsDB collections:', collections);
      res.status(200).json({ database: 'NailsDB', collections });
    } catch (error) {
      next(error);
    }
  },

  getNailsDBCollectionSummary: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collections = await dbService.getNailsDBCollectionSummary();
      console.log('[debug] NailsDB collection summary:', collections);
      res.status(200).json({ database: 'NailsDB', collections });
    } catch (error) {
      next(error);
    }
  },
};
