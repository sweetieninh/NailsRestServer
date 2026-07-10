"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreModel = void 0;
const mongoose_1 = require("mongoose");
const StoreSchema = new mongoose_1.Schema({
    storeId: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
}, { timestamps: true });
exports.StoreModel = (0, mongoose_1.model)('Store', StoreSchema);
