"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkinController = void 0;
const checkinService_1 = require("../services/checkinService");
exports.checkinController = {
    lookup: async (req, res, next) => {
        try {
            const result = await checkinService_1.checkinService.lookupCustomer(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    create: async (req, res, next) => {
        try {
            const result = await checkinService_1.checkinService.createCheckin(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
