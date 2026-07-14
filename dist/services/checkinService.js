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
const startOfWeekMonday = (source) => {
    const date = new Date(source);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
};
const startOfMonth = (source) => {
    const date = new Date(source.getFullYear(), source.getMonth(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
};
const parseDateOnly = (value) => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const nextDay = (source) => {
    const date = new Date(source);
    date.setDate(date.getDate() + 1);
    return date;
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
    authenticateManager: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const employeesCollection = mongoose_1.default.connection.db.collection('employees');
        const normalizedPhone = normalizeDigits(input.phone);
        const managerCandidates = await employeesCollection
            .find({
            businessId: input.businessId,
            managerOfStoreId: input.storeId,
            passcode: input.pin,
        })
            .toArray();
        const manager = managerCandidates.find((candidate) => normalizeDigits(String(candidate.phone ?? '')) === normalizedPhone);
        if (!manager) {
            return { valid: false };
        }
        return {
            valid: true,
            employee: {
                id: String(manager._id ?? ''),
                firstName: String(manager.firstName ?? ''),
                lastName: String(manager.lastName ?? ''),
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
    getActiveCustomerCart: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const cartCollection = mongoose_1.default.connection.db.collection('customerCart');
        const cart = await cartCollection.findOne({
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
            status: 'ACTIVE',
        });
        return { cart: cart || null };
    },
    saveCustomerCart: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const cartCollection = mongoose_1.default.connection.db.collection('customerCart');
        const timestamp = new Date();
        const update = {
            $set: {
                businessId: input.businessId,
                storeId: input.storeId,
                customerId: input.customerId,
                customerSnapshot: {
                    firstName: input.customerFirstName || '',
                    lastName: input.customerLastName || '',
                },
                technicianId: input.technicianId || '',
                services: input.services,
                inventoryItems: input.inventoryItems,
                pricing: input.pricing,
                currency: input.currency || 'USD',
                status: 'ACTIVE',
                updatedAt: timestamp,
            },
            $setOnInsert: {
                cartId: (0, idGenerator_1.generateReadableId)('cart'),
                createdAt: timestamp,
            },
        };
        await cartCollection.findOneAndUpdate({
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
            status: 'ACTIVE',
        }, update, { upsert: true, returnDocument: 'after' });
        const cart = await cartCollection.findOne({
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
            status: 'ACTIVE',
        });
        return {
            message: 'Cart saved successfully',
            cart,
        };
    },
    checkoutCustomerCart: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const cartCollection = mongoose_1.default.connection.db.collection('customerCart');
        const orderCollection = mongoose_1.default.connection.db.collection('customerOrder');
        const timestamp = new Date();
        const cart = await cartCollection.findOne({
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
            status: 'ACTIVE',
        });
        if (!cart) {
            throw new Error('Active cart not found');
        }
        const order = {
            orderId: (0, idGenerator_1.generateReadableId)('order'),
            cartId: String(cart.cartId || ''),
            businessId: input.businessId,
            storeId: input.storeId,
            customerId: input.customerId,
            customerSnapshot: cart.customerSnapshot || {},
            technicianId: cart.technicianId || '',
            services: cart.services || [],
            inventoryItems: cart.inventoryItems || [],
            pricing: cart.pricing || { subtotal: 0, total: 0 },
            currency: cart.currency || 'USD',
            payment: {
                status: 'PAID',
                paidAt: timestamp,
            },
            status: 'COMPLETED',
            createdAt: timestamp,
            updatedAt: timestamp,
        };
        await orderCollection.insertOne(order);
        await cartCollection.updateOne({ _id: cart._id }, {
            $set: {
                status: 'CHECKED_OUT',
                orderId: order.orderId,
                checkedOutAt: timestamp,
                updatedAt: timestamp,
            },
        });
        return {
            message: 'Checkout completed successfully',
            order,
        };
    },
    getStoreReport: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const now = new Date();
        let rangeStart;
        let rangeEndExclusive;
        if (input.reportType === 'today') {
            const { start, end } = startAndEndOfToday();
            rangeStart = start;
            rangeEndExclusive = end;
        }
        else if (input.reportType === 'week') {
            rangeStart = startOfWeekMonday(now);
            const weekEnd = new Date(rangeStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            rangeEndExclusive = weekEnd;
        }
        else if (input.reportType === 'month') {
            rangeStart = startOfMonth(now);
            const endOfTodayExclusive = nextDay(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
            rangeEndExclusive = endOfTodayExclusive;
        }
        else {
            const parsedStart = input.startDate ? parseDateOnly(input.startDate) : null;
            const parsedEnd = input.endDate ? parseDateOnly(input.endDate) : null;
            if (!parsedStart || !parsedEnd) {
                throw new Error('Invalid custom date range');
            }
            rangeStart = parsedStart;
            rangeEndExclusive = nextDay(parsedEnd);
        }
        const orderCollection = mongoose_1.default.connection.db.collection('customerOrder');
        const orders = await orderCollection
            .find({
            businessId: input.businessId,
            storeId: input.storeId,
            status: 'COMPLETED',
            'payment.status': 'PAID',
            createdAt: { $gte: rangeStart, $lt: rangeEndExclusive },
        })
            .sort({ createdAt: -1 })
            .toArray();
        const totalAmount = orders.reduce((sum, order) => sum + Number(order?.pricing?.total || 0), 0);
        const techIds = Array.from(new Set(orders.map((order) => String(order.technicianId || '')).filter((value) => value)));
        const techniciansCollection = mongoose_1.default.connection.db.collection('technicians');
        const technicians = techIds.length
            ? await techniciansCollection
                .find({
                businessId: input.businessId,
                storeId: input.storeId,
                $or: [{ technicianId: { $in: techIds } }, { _id: { $in: techIds } }],
            })
                .toArray()
            : [];
        const techById = new Map();
        technicians.forEach((item) => {
            if (item.technicianId) {
                techById.set(String(item.technicianId), item);
            }
            if (item._id) {
                techById.set(String(item._id), item);
            }
        });
        const formatMonthLabel = (date) => `Month - ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
        const formatTodayLabel = (date) => `Today - ${date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        })}`;
        const formatDayLabel = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });
        const weekOfMonth = (date) => Math.floor((date.getDate() - 1) / 7) + 1;
        const appendOrderDetails = (customerNode, order) => {
            const services = Array.isArray(order.services) ? order.services : [];
            services.forEach((service, index) => {
                const price = Number(service?.unitPrice || 0);
                customerNode.children.push({
                    id: `service-${String(order.orderId || order._id || 'order')}-${index}`,
                    nodeType: 'service',
                    label: String(service?.serviceType || 'Service'),
                    subtotal: price,
                    children: [],
                });
            });
        };
        const getTechInfo = (order) => {
            const techId = String(order.technicianId || 'unassigned');
            const tech = techById.get(techId);
            const firstName = String(order?.technicianSnapshot?.firstName || tech?.firstName || 'Unknown');
            const lastName = String(order?.technicianSnapshot?.lastName || tech?.lastName || '');
            return { techId, firstName, lastName };
        };
        const getCustomerInfo = (order) => {
            const customerId = String(order.customerId || 'unknown-customer');
            const firstName = String(order?.customerSnapshot?.firstName || 'Customer');
            const lastName = String(order?.customerSnapshot?.lastName || '');
            return { customerId, firstName, lastName };
        };
        const roots = [];
        if (input.reportType === 'today') {
            const rootDate = rangeStart;
            const todayRoot = {
                id: `today-${rootDate.toISOString()}`,
                nodeType: 'today',
                label: formatTodayLabel(rootDate),
                subtotal: 0,
                children: [],
            };
            const techMap = new Map();
            orders.forEach((order) => {
                const orderTotal = Number(order?.pricing?.total || 0);
                todayRoot.subtotal += orderTotal;
                const { techId, firstName, lastName } = getTechInfo(order);
                let techNode = techMap.get(techId);
                if (!techNode) {
                    techNode = {
                        id: `tech-${techId}`,
                        nodeType: 'technician',
                        label: `${firstName} ${lastName}`.trim(),
                        subtotal: 0,
                        children: [],
                    };
                    techMap.set(techId, techNode);
                    todayRoot.children.push(techNode);
                }
                techNode.subtotal += orderTotal;
                const { customerId, firstName: customerFirstName, lastName: customerLastName } = getCustomerInfo(order);
                let customerNode = techNode.children.find((node) => node.id === `customer-${customerId}`);
                if (!customerNode) {
                    customerNode = {
                        id: `customer-${customerId}`,
                        nodeType: 'customer',
                        label: `${customerFirstName} ${customerLastName}`.trim(),
                        subtotal: 0,
                        children: [],
                    };
                    techNode.children.push(customerNode);
                }
                customerNode.subtotal += orderTotal;
                appendOrderDetails(customerNode, order);
            });
            roots.push(todayRoot);
        }
        else {
            const monthMap = new Map();
            orders.forEach((order) => {
                const createdAt = new Date(order.createdAt);
                if (Number.isNaN(createdAt.getTime())) {
                    return;
                }
                const orderTotal = Number(order?.pricing?.total || 0);
                const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
                let monthEntry = monthMap.get(monthKey);
                if (!monthEntry) {
                    const monthNode = {
                        id: `month-${monthKey}`,
                        nodeType: 'month',
                        label: formatMonthLabel(createdAt),
                        subtotal: 0,
                        children: [],
                    };
                    monthEntry = { node: monthNode, weeks: new Map() };
                    monthMap.set(monthKey, monthEntry);
                    roots.push(monthNode);
                }
                monthEntry.node.subtotal += orderTotal;
                const weekNumber = weekOfMonth(createdAt);
                const weekKey = `${monthKey}-week-${weekNumber}`;
                let weekEntry = monthEntry.weeks.get(weekKey);
                if (!weekEntry) {
                    const weekNode = {
                        id: `week-${weekKey}`,
                        nodeType: 'week',
                        label: `Week ${weekNumber}`,
                        subtotal: 0,
                        children: [],
                    };
                    weekEntry = { node: weekNode, days: new Map() };
                    monthEntry.weeks.set(weekKey, weekEntry);
                    monthEntry.node.children.push(weekNode);
                }
                weekEntry.node.subtotal += orderTotal;
                const dayKey = createdAt.toISOString().slice(0, 10);
                let dayEntry = weekEntry.days.get(dayKey);
                if (!dayEntry) {
                    const dayNode = {
                        id: `day-${dayKey}`,
                        nodeType: 'day',
                        label: formatDayLabel(createdAt),
                        subtotal: 0,
                        children: [],
                    };
                    dayEntry = { node: dayNode, techs: new Map() };
                    weekEntry.days.set(dayKey, dayEntry);
                    weekEntry.node.children.push(dayNode);
                }
                dayEntry.node.subtotal += orderTotal;
                const { techId, firstName, lastName } = getTechInfo(order);
                let techNode = dayEntry.techs.get(techId);
                if (!techNode) {
                    techNode = {
                        id: `tech-${dayKey}-${techId}`,
                        nodeType: 'technician',
                        label: `${firstName} ${lastName}`.trim(),
                        subtotal: 0,
                        children: [],
                    };
                    dayEntry.techs.set(techId, techNode);
                    dayEntry.node.children.push(techNode);
                }
                techNode.subtotal += orderTotal;
                const { customerId, firstName: customerFirstName, lastName: customerLastName } = getCustomerInfo(order);
                let customerNode = techNode.children.find((node) => node.id === `customer-${customerId}`);
                if (!customerNode) {
                    customerNode = {
                        id: `customer-${dayKey}-${customerId}`,
                        nodeType: 'customer',
                        label: `${customerFirstName} ${customerLastName}`.trim(),
                        subtotal: 0,
                        children: [],
                    };
                    techNode.children.push(customerNode);
                }
                customerNode.subtotal += orderTotal;
                appendOrderDetails(customerNode, order);
            });
        }
        return {
            reportType: input.reportType,
            from: rangeStart,
            to: new Date(rangeEndExclusive.getTime() - 1),
            totalAmount,
            tree: roots,
        };
    },
    getTechnicianReport: async (input) => {
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database is not connected');
        }
        const now = new Date();
        let rangeStart;
        let rangeEndExclusive;
        if (input.reportType === 'today') {
            const { start, end } = startAndEndOfToday();
            rangeStart = start;
            rangeEndExclusive = end;
        }
        else if (input.reportType === 'week') {
            rangeStart = startOfWeekMonday(now);
            const weekEnd = new Date(rangeStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            rangeEndExclusive = weekEnd;
        }
        else if (input.reportType === 'month') {
            rangeStart = startOfMonth(now);
            rangeEndExclusive = nextDay(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        }
        else {
            const parsedStart = input.startDate ? parseDateOnly(input.startDate) : null;
            const parsedEnd = input.endDate ? parseDateOnly(input.endDate) : null;
            if (!parsedStart || !parsedEnd) {
                throw new Error('Invalid custom date range');
            }
            rangeStart = parsedStart;
            rangeEndExclusive = nextDay(parsedEnd);
        }
        const orderCollection = mongoose_1.default.connection.db.collection('customerOrder');
        const orders = await orderCollection
            .find({
            businessId: input.businessId,
            storeId: input.storeId,
            technicianId: input.technicianId,
            status: 'COMPLETED',
            'payment.status': 'PAID',
            createdAt: { $gte: rangeStart, $lt: rangeEndExclusive },
        })
            .sort({ createdAt: -1 })
            .toArray();
        const totalAmount = orders.reduce((sum, order) => sum + Number(order?.pricing?.total || 0), 0);
        const formatMonthLabel = (date) => `Month - ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
        const formatTodayLabel = (date) => `Today - ${date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        })}`;
        const formatDayLabel = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });
        const weekOfMonth = (date) => Math.floor((date.getDate() - 1) / 7) + 1;
        const appendServices = (customerNode, order) => {
            const services = Array.isArray(order.services) ? order.services : [];
            services.forEach((service, index) => {
                const price = Number(service?.unitPrice || 0);
                customerNode.children.push({
                    id: `service-${String(order.orderId || order._id || 'order')}-${index}`,
                    nodeType: 'service',
                    label: String(service?.serviceType || 'Service'),
                    subtotal: price,
                    children: [],
                });
            });
        };
        const roots = [];
        if (input.reportType === 'today') {
            const todayRoot = {
                id: `today-${rangeStart.toISOString()}`,
                nodeType: 'today',
                label: formatTodayLabel(rangeStart),
                subtotal: 0,
                children: [],
            };
            orders.forEach((order) => {
                const orderTotal = Number(order?.pricing?.total || 0);
                todayRoot.subtotal += orderTotal;
                const customerId = String(order.customerId || 'unknown-customer');
                const firstName = String(order?.customerSnapshot?.firstName || 'Customer');
                const lastName = String(order?.customerSnapshot?.lastName || '');
                let customerNode = todayRoot.children.find((node) => node.id === `customer-${customerId}`);
                if (!customerNode) {
                    customerNode = {
                        id: `customer-${customerId}`,
                        nodeType: 'customer',
                        label: `${firstName} ${lastName}`.trim(),
                        subtotal: 0,
                        children: [],
                    };
                    todayRoot.children.push(customerNode);
                }
                customerNode.subtotal += orderTotal;
                appendServices(customerNode, order);
            });
            roots.push(todayRoot);
        }
        else {
            const monthMap = new Map();
            orders.forEach((order) => {
                const createdAt = new Date(order.createdAt);
                if (Number.isNaN(createdAt.getTime())) {
                    return;
                }
                const orderTotal = Number(order?.pricing?.total || 0);
                const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
                let monthEntry = monthMap.get(monthKey);
                if (!monthEntry) {
                    const monthNode = {
                        id: `month-${monthKey}`,
                        nodeType: 'month',
                        label: formatMonthLabel(createdAt),
                        subtotal: 0,
                        children: [],
                    };
                    monthEntry = { node: monthNode, weeks: new Map() };
                    monthMap.set(monthKey, monthEntry);
                    roots.push(monthNode);
                }
                monthEntry.node.subtotal += orderTotal;
                const weekNumber = weekOfMonth(createdAt);
                const weekKey = `${monthKey}-week-${weekNumber}`;
                let weekEntry = monthEntry.weeks.get(weekKey);
                if (!weekEntry) {
                    const weekNode = {
                        id: `week-${weekKey}`,
                        nodeType: 'week',
                        label: `Week ${weekNumber}`,
                        subtotal: 0,
                        children: [],
                    };
                    weekEntry = { node: weekNode, days: new Map() };
                    monthEntry.weeks.set(weekKey, weekEntry);
                    monthEntry.node.children.push(weekNode);
                }
                weekEntry.node.subtotal += orderTotal;
                const dayKey = createdAt.toISOString().slice(0, 10);
                let dayNode = weekEntry.days.get(dayKey);
                if (!dayNode) {
                    dayNode = {
                        id: `day-${dayKey}`,
                        nodeType: 'day',
                        label: formatDayLabel(createdAt),
                        subtotal: 0,
                        children: [],
                    };
                    weekEntry.days.set(dayKey, dayNode);
                    weekEntry.node.children.push(dayNode);
                }
                dayNode.subtotal += orderTotal;
                const customerId = String(order.customerId || 'unknown-customer');
                const firstName = String(order?.customerSnapshot?.firstName || 'Customer');
                const lastName = String(order?.customerSnapshot?.lastName || '');
                let customerNode = dayNode.children.find((node) => node.id === `customer-${dayKey}-${customerId}`);
                if (!customerNode) {
                    customerNode = {
                        id: `customer-${dayKey}-${customerId}`,
                        nodeType: 'customer',
                        label: `${firstName} ${lastName}`.trim(),
                        subtotal: 0,
                        children: [],
                    };
                    dayNode.children.push(customerNode);
                }
                customerNode.subtotal += orderTotal;
                appendServices(customerNode, order);
            });
        }
        return {
            reportType: input.reportType,
            from: rangeStart,
            to: new Date(rangeEndExclusive.getTime() - 1),
            totalAmount,
            tree: roots,
        };
    },
};
