"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomerValidator = void 0;
const zod_1 = require("zod");
exports.registerCustomerValidator = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    birthday: zod_1.z.string().min(1),
    allowSMS: zod_1.z.boolean(),
    allowEmail: zod_1.z.boolean(),
});
