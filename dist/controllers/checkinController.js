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
    managerAuth: async (req, res, next) => {
        try {
            const result = await checkinService_1.checkinService.authenticateManager(req.body);
            if (!result.valid) {
                res.status(401).json({ message: 'Invalid manager phone or PIN' });
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
    technicians: async (req, res, next) => {
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
            const result = await checkinService_1.checkinService.getTechniciansByStore(input);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    inventory: async (req, res, next) => {
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
            const result = await checkinService_1.checkinService.getInventoryByStore(input);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    serviceTypes: async (req, res, next) => {
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
            const result = await checkinService_1.checkinService.getServiceTypesByStore(input);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    getCart: async (req, res, next) => {
        try {
            const parsed = checkinValidator_1.cartQueryValidator.safeParse(req.query);
            if (!parsed.success) {
                res.status(400).json({
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
                return;
            }
            const result = await checkinService_1.checkinService.getActiveCustomerCart(parsed.data);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    saveCart: async (req, res, next) => {
        try {
            const result = await checkinService_1.checkinService.saveCustomerCart(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    checkout: async (req, res, next) => {
        try {
            const result = await checkinService_1.checkinService.checkoutCustomerCart(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    storeReport: async (req, res, next) => {
        try {
            const parsed = checkinValidator_1.storeReportValidator.safeParse(req.query);
            if (!parsed.success) {
                res.status(400).json({
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
                return;
            }
            const result = await checkinService_1.checkinService.getStoreReport(parsed.data);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
