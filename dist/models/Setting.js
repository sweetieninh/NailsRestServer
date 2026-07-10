"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingModel = void 0;
const mongoose_1 = require("mongoose");
const SettingSchema = new mongoose_1.Schema({
    businessId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
}, { timestamps: true });
SettingSchema.index({ businessId: 1, storeId: 1, key: 1 }, { unique: true });
exports.SettingModel = (0, mongoose_1.model)('Setting', SettingSchema);
