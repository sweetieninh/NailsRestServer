"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbController = void 0;
const dbService_1 = require("../services/dbService");
exports.dbController = {
    getNailsDBCollections: async (_req, res, next) => {
        try {
            const collections = await dbService_1.dbService.getNailsDBCollections();
            res.status(200).json({ database: 'NailsDB', collections });
        }
        catch (error) {
            next(error);
        }
    },
    getNailsDBCollectionSummary: async (_req, res, next) => {
        try {
            const collections = await dbService_1.dbService.getNailsDBCollectionSummary();
            res.status(200).json({ database: 'NailsDB', collections });
        }
        catch (error) {
            next(error);
        }
    },
};
