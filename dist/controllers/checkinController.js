"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkinController = void 0;
const checkinService_1 = require("../services/checkinService");
const checkinValidator_1 = require("../validators/checkinValidator");
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
    staffAuth: async (req, res, next) => {
        try {
            const result = await checkinService_1.checkinService.authenticateStaff(req.body);
            if (!result.valid) {
                res.status(401).json({ message: 'Invalid phone or PIN' });
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    todayCheckins: async (req, res, next) => {
        try {
            const parsed = checkinValidator_1.todayCheckinsValidator.safeParse(req.query);
            if (!parsed.success) {
                res.status(400).json({
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
                return;
            }
            const input = parsed.data;
            const result = await checkinService_1.checkinService.getTodayCheckedInCustomers(input);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
