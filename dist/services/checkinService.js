"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkinService = void 0;
const CheckIn_1 = require("../models/CheckIn");
const Customer_1 = require("../models/Customer");
const mongoose_1 = __importDefault(require("mongoose"));
const idGenerator_1 = require("../utils/idGenerator");
const normalizeDigits = (value) => value.replace(/\D/g, '');
const startAndEndOfToday = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};
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
        const resolvedCustomerId = customer.customerId || String(customer._id || '');
        const latestCheckin = await CheckIn_1.CheckInModel.findOne({
            businessId: input.businessId,
            storeId: input.storeId,
            $or: [
                { customerId: resolvedCustomerId },
                { phone: input.phone },
            ],
        })
            .sort({ checkedInAt: -1 })
            .lean();
        return {
            customerExists: true,
            lastCheckinAt: latestCheckin?.checkedInAt || new Date(),
            customer: {
                ...customer,
                customerId: resolvedCustomerId,
            },
        };
    },
    createCheckin: async (input) => {
        if (!input.customerId) {
            throw new Error('Customer ID is required');
        }
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const customersCollection = mongoose_1.default.connection.db.collection('customers');
        const objectIdCandidate = mongoose_1.default.Types.ObjectId.isValid(input.customerId)
            ? new mongoose_1.default.Types.ObjectId(input.customerId)
            : null;
        const customerIdFilters = [
            { customerId: input.customerId },
            { _id: input.customerId },
        ];
        if (objectIdCandidate) {
            customerIdFilters.push({ _id: objectIdCandidate });
        }
        const customer = await customersCollection.findOne({
            businessId: input.businessId,
            $and: [
                {
                    $or: [
                        { storeId: input.storeId },
                        { primaryStoreId: input.storeId },
                    ],
                },
                {
                    $or: customerIdFilters,
                },
            ],
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const resolvedCustomerId = String(customer.customerId || customer._id || input.customerId);
        const resolvedPhone = input.phone && input.phone.trim() ? input.phone : String(customer.phone || '');
        const checkinTimestamp = new Date();
        const checkinId = (0, idGenerator_1.generateReadableId)('checkin');
        const checkin = await CheckIn_1.CheckInModel.create({
            checkinId,
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: resolvedCustomerId,
            phone: resolvedPhone,
            checkedInAt: checkinTimestamp,
        });
        await customersCollection.updateOne({
            businessId: input.businessId,
            $or: [
                { customerId: resolvedCustomerId },
                { _id: customer._id },
            ],
        }, {
            $set: { 'statistics.lastVisit': checkinTimestamp },
            $inc: { 'statistics.totalVisits': 1 },
        });
        return {
            message: 'Check-in created successfully',
            customerExists: true,
            customer,
            checkin,
        };
    },
    authenticateStaff: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const employeesCollection = mongoose_1.default.connection.db.collection('employees');
        const normalizedPhone = normalizeDigits(input.phone);
        const employeeCandidates = await employeesCollection
            .find({
            businessId: input.businessId,
            storeId: input.storeId,
            passcode: input.pin,
        })
            .toArray();
        const employee = employeeCandidates.find((candidate) => normalizeDigits(String(candidate.phone ?? '')) === normalizedPhone);
        if (!employee) {
            return { valid: false };
        }
        return {
            valid: true,
            employee: {
                id: String(employee._id ?? ''),
                firstName: String(employee.firstName ?? ''),
                lastName: String(employee.lastName ?? ''),
            },
        };
    },
    getTodayCheckedInCustomers: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const { start, end } = startAndEndOfToday();
        const checkins = await CheckIn_1.CheckInModel.find({
            businessId: input.businessId,
            storeId: input.storeId,
            checkedInAt: { $gte: start, $lt: end },
        })
            .sort({ checkedInAt: -1 })
            .lean();
        if (!checkins.length) {
            return { customers: [] };
        }
        const customerIds = checkins.map((item) => item.customerId);
        const customersCollection = mongoose_1.default.connection.db.collection('customers');
        const customers = await customersCollection
            .find({
            businessId: input.businessId,
            $or: [{ customerId: { $in: customerIds } }, { _id: { $in: customerIds } }],
        })
            .toArray();
        const customerById = new Map();
        customers.forEach((item) => {
            if (item.customerId) {
                customerById.set(String(item.customerId), item);
            }
            if (item._id) {
                customerById.set(String(item._id), item);
            }
        });
        const latestByCustomer = new Map();
        checkins.forEach((checkin) => {
            const key = String(checkin.customerId || checkin.phone || '');
            if (!latestByCustomer.has(key)) {
                latestByCustomer.set(key, checkin);
            }
        });
        const list = Array.from(latestByCustomer.values()).map((checkin) => {
            const customer = customerById.get(String(checkin.customerId));
            return {
                checkinId: checkin.checkinId,
                checkedInAt: checkin.checkedInAt,
                customerId: checkin.customerId,
                firstName: customer?.firstName || 'Unknown',
                lastName: customer?.lastName || '',
                phone: customer?.phone || checkin.phone,
            };
        });
        return { customers: list };
    },
    getTechniciansByStore: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const techniciansCollection = mongoose_1.default.connection.db.collection('technicians');
        const technicians = await techniciansCollection
            .find({
            businessId: input.businessId,
            storeId: input.storeId,
        })
            .sort({ firstName: 1, lastName: 1 })
            .toArray();
        return {
            technicians: technicians.map((item) => ({
                id: String(item.technicianId || item._id || ''),
                firstName: String(item.firstName || ''),
                lastName: String(item.lastName || ''),
            })),
        };
    },
    getInventoryByStore: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const inventoryCollection = mongoose_1.default.connection.db.collection('inventory');
        const inventory = await inventoryCollection
            .find({
            businessId: input.businessId,
            storeId: input.storeId,
            active: true,
        })
            .sort({ category: 1, itemName: 1 })
            .toArray();
        return {
            items: inventory.map((item) => ({
                id: String(item.inventoryId || item._id || ''),
                category: String(item.category || 'Other'),
                itemName: String(item.itemName || ''),
                unitCost: Number(item.unitCost || 0),
            })),
        };
    },
    getServiceTypesByStore: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const serviceTypeCollection = mongoose_1.default.connection.db.collection('serviceType');
        const serviceTypes = await serviceTypeCollection
            .find({
            businessId: input.businessId,
            storeId: input.storeId,
        })
            .sort({ serviceType: 1 })
            .toArray();
        return {
            services: serviceTypes.map((item) => ({
                id: String(item.serviceTypeId || item._id || item.serviceType || ''),
                serviceType: String(item.serviceType || ''),
                price: Number(item.price || 0),
            })),
        };
    },
};
