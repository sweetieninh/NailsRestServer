"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessModel = void 0;
const mongoose_1 = require("mongoose");
const BusinessSchema = new mongoose_1.Schema({
    businessId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
}, { timestamps: true });
exports.BusinessModel = (0, mongoose_1.model)('Business', BusinessSchema);
