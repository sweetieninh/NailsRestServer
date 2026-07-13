"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeReportValidator = exports.checkoutValidator = exports.saveCartValidator = exports.cartQueryValidator = exports.todayCheckinsValidator = exports.staffAuthValidator = exports.createCheckinValidator = exports.lookupValidator = void 0;
const zod_1 = require("zod");
exports.lookupValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(1),
});
exports.createCheckinValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    customerId: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional(),
});
exports.staffAuthValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(1),
    pin: zod_1.z.string().min(1),
});
exports.todayCheckinsValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
});
exports.cartQueryValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    customerId: zod_1.z.string().min(1),
});
const cartServiceItemValidator = zod_1.z.object({
    serviceTypeId: zod_1.z.string().min(1),
    serviceType: zod_1.z.string().min(1),
    unitPrice: zod_1.z.number(),
    isCustomPrice: zod_1.z.boolean().optional(),
});
const cartInventoryItemValidator = zod_1.z.object({
    inventoryId: zod_1.z.string().min(1),
    itemName: zod_1.z.string().min(1),
    unitPrice: zod_1.z.number(),
    category: zod_1.z.string().optional(),
});
exports.saveCartValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    customerId: zod_1.z.string().min(1),
    customerFirstName: zod_1.z.string().optional(),
    customerLastName: zod_1.z.string().optional(),
    technicianId: zod_1.z.string().optional(),
    services: zod_1.z.array(cartServiceItemValidator),
    inventoryItems: zod_1.z.array(cartInventoryItemValidator),
    pricing: zod_1.z.object({
        subtotal: zod_1.z.number(),
        total: zod_1.z.number(),
    }),
    currency: zod_1.z.string().optional(),
});
exports.checkoutValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    customerId: zod_1.z.string().min(1),
});
exports.storeReportValidator = zod_1.z
    .object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    reportType: zod_1.z.enum(['today', 'week', 'month', 'custom']),
    showDetails: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((value) => (typeof value === 'boolean' ? value : value === 'true')),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
})
    .superRefine((value, context) => {
    if (value.reportType !== 'custom') {
        return;
    }
    if (!value.startDate) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['startDate'],
            message: 'startDate is required for custom report type',
        });
    }
    if (!value.endDate) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate is required for custom report type',
        });
    }
});
