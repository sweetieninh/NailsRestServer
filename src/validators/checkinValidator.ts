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
  phone: z.string().optional(),
});

export const staffAuthValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  phone: z.string().min(1),
  pin: z.string().min(1),
});

export const todayCheckinsValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
});

export const cartQueryValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  customerId: z.string().min(1),
});

const cartServiceItemValidator = z.object({
  serviceTypeId: z.string().min(1),
  serviceType: z.string().min(1),
  unitPrice: z.number(),
  isCustomPrice: z.boolean().optional(),
});

const cartInventoryItemValidator = z.object({
  inventoryId: z.string().min(1),
  itemName: z.string().min(1),
  unitPrice: z.number(),
  category: z.string().optional(),
});

export const saveCartValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  customerId: z.string().min(1),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  technicianId: z.string().optional(),
  services: z.array(cartServiceItemValidator),
  inventoryItems: z.array(cartInventoryItemValidator),
  pricing: z.object({
    subtotal: z.number(),
    total: z.number(),
  }),
  currency: z.string().optional(),
});

export const checkoutValidator = z.object({
  businessId: z.string().min(1),
  storeId: z.string().min(1),
  customerId: z.string().min(1),
});

export const storeReportValidator = z
  .object({
    businessId: z.string().min(1),
    storeId: z.string().min(1),
    reportType: z.enum(['today', 'week', 'month', 'custom']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.reportType !== 'custom') {
      return;
    }

    if (!value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: 'startDate is required for custom report type',
      });
    }

    if (!value.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate is required for custom report type',
      });
    }
  });

export const technicianReportValidator = z
  .object({
    businessId: z.string().min(1),
    storeId: z.string().min(1),
    technicianId: z.string().min(1),
    reportType: z.enum(['today', 'week', 'month', 'custom']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.reportType !== 'custom') {
      return;
    }

    if (!value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: 'startDate is required for custom report type',
      });
    }

    if (!value.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate is required for custom report type',
      });
    }
  });
