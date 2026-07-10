"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.dbService = {
    getNailsDBCollections: async () => {
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Database connection is not available');
        }
        const collections = await db.listCollections().toArray();
        return collections.map((collection) => collection.name);
    },
    getNailsDBCollectionSummary: async () => {
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Database connection is not available');
        }
        const collections = await db.listCollections().toArray();
        const summaries = await Promise.all(collections.map(async (collection) => {
            const count = await db.collection(collection.name).countDocuments();
            return { name: collection.name, count };
        }));
        return summaries.sort((a, b) => a.name.localeCompare(b.name));
    },
};
