import { Request, Response, NextFunction } from 'express';
import { customersService } from '../services/customersService';

export const customersController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await customersService.registerCustomer(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
