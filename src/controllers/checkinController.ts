import { Request, Response, NextFunction } from 'express';
import { checkinService } from '../services/checkinService';

export const checkinController = {
  lookup: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await checkinService.lookupCustomer(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await checkinService.createCheckin(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
