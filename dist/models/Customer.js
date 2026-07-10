"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModel = void 0;
const mongoose_1 = require("mongoose");
const CustomerSchema = new mongoose_1.Schema({
    customerId: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    birthday: { type: String, required: true },
    allowSMS: { type: Boolean, required: true },
    allowEmail: { type: Boolean, required: true },
    statistics: {
        lastVisit: { type: Date },
        totalVisits: { type: Number, default: 0 },
    },
}, { timestamps: true });
CustomerSchema.index({ businessId: 1, storeId: 1, phone: 1 }, { unique: true });
exports.CustomerModel = (0, mongoose_1.model)('Customer', CustomerSchema);
