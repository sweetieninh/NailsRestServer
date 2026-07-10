"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersController = void 0;
const customersService_1 = require("../services/customersService");
exports.customersController = {
    register: async (req, res, next) => {
        try {
            const result = await customersService_1.customersService.registerCustomer(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
