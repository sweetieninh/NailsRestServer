"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersService = void 0;
const CheckIn_1 = require("../models/CheckIn");
const Customer_1 = require("../models/Customer");
const idGenerator_1 = require("../utils/idGenerator");
exports.customersService = {
    registerCustomer: async (input) => {
        const existingCustomer = await Customer_1.CustomerModel.findOne({
            businessId: input.businessId,
            storeId: input.storeId,
            phone: input.phone,
        });
        if (existingCustomer) {
            throw new Error('Customer already exists for this business and store');
        }
        const customerId = (0, idGenerator_1.generateReadableId)('cust');
        const customer = await Customer_1.CustomerModel.create({
            customerId,
            businessId: input.businessId,
            storeId: input.storeId,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
            birthday: input.birthday,
            allowSMS: input.allowSMS,
            allowEmail: input.allowEmail,
            statistics: {
                lastVisit: new Date(),
                totalVisits: 1,
            },
        });
        const checkinId = (0, idGenerator_1.generateReadableId)('checkin');
        const checkin = await CheckIn_1.CheckInModel.create({
            checkinId,
            businessId: input.businessId,
            storeId: input.storeId,
            customerId,
            phone: input.phone,
            checkedInAt: new Date(),
        });
        return {
            message: 'Customer registered and checked in successfully',
            customer,
            checkin,
        };
    },
};
