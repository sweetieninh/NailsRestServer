import { z } from 'zod';

export const registerCustomerValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  birthday: z.string().min(1),
  allowSMS: z.boolean(),
  allowEmail: z.boolean(),
});
