import { Request, Response, NextFunction } from 'express';
import { checkinService } from '../services/checkinService';
import { todayCheckinsValidator } from '../validators/checkinValidator';

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

  staffAuth: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await checkinService.authenticateStaff(req.body);

      if (!result.valid) {
        res.status(401).json({ message: 'Invalid phone or PIN' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  todayCheckins: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = todayCheckinsValidator.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const input = parsed.data;
      const result = await checkinService.getTodayCheckedInCustomers(input);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  technicians: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = todayCheckinsValidator.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const input = parsed.data;
      const result = await checkinService.getTechniciansByStore(input);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  inventory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = todayCheckinsValidator.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const input = parsed.data;
      const result = await checkinService.getInventoryByStore(input);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  serviceTypes: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = todayCheckinsValidator.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const input = parsed.data;
      const result = await checkinService.getServiceTypesByStore(input);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
