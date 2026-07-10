"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkinService = void 0;
const CheckIn_1 = require("../models/CheckIn");
const Customer_1 = require("../models/Customer");
const idGenerator_1 = require("../utils/idGenerator");
exports.checkinService = {
    lookupCustomer: async (input) => {
        const customer = await Customer_1.CustomerModel.findOne({
            businessId: input.businessId,
            $or: [{ storeId: input.storeId }, { primaryStoreId: input.storeId }],
            phone: input.phone,
        }).lean();
        if (!customer) {
            return { customerExists: false };
        }
        return {
            customerExists: true,
            customer,
        };
    },
    createCheckin: async (input) => {
        const customer = await Customer_1.CustomerModel.findOne({
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const checkinId = (0, idGenerator_1.generateReadableId)('checkin');
        const checkin = await CheckIn_1.CheckInModel.create({
            checkinId,
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
            phone: input.phone,
            checkedInAt: new Date(),
        });
        customer.statistics.lastVisit = new Date();
        customer.statistics.totalVisits = (customer.statistics.totalVisits || 0) + 1;
        await customer.save();
        return {
            message: 'Check-in created successfully',
            customerExists: true,
            customer,
            checkin,
        };
    },
};
