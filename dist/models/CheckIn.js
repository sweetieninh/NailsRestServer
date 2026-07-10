"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckInModel = void 0;
const mongoose_1 = require("mongoose");
const CheckInSchema = new mongoose_1.Schema({
    checkinId: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    checkedInAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.CheckInModel = (0, mongoose_1.model)('CheckIn', CheckInSchema);
