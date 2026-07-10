"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckinValidator = exports.lookupValidator = void 0;
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
    phone: zod_1.z.string().min(1),
});
