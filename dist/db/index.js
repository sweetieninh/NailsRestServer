"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const node_dns_1 = __importDefault(require("node:dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const connectDB = async () => {
    if (!config_1.config.mongoUri) {
        throw new Error('MONGO_URI is not defined');
    }
    if (process.env.USE_DNS_FALLBACK === 'true') {
        node_dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
        console.log('Using DNS fallback servers: 8.8.8.8, 1.1.1.1');
    }
    await mongoose_1.default.connect(config_1.config.mongoUri, {
        dbName: config_1.config.dbName,
        serverSelectionTimeoutMS: 15000,
        family: 4,
    });
    console.log(`Connected to MongoDB database: ${config_1.config.dbName}`);
};
exports.connectDB = connectDB;
