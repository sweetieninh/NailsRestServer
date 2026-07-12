"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT || 4020),
    host: process.env.HOST || '192.168.9.152',
    mongoUri: process.env.MONGO_URI || '',
    dbName: process.env.DB_NAME || 'NailsDB',
};
