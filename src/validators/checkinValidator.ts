import { z } from 'zod';

export const lookupValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  phone: z.string().min(1),
});

export const createCheckinValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  customerId: z.string().min(1),
  phone: z.string().min(1),
});
