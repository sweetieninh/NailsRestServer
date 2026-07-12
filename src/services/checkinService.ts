import { CheckInModel } from '../models/CheckIn';
import { CustomerModel } from '../models/Customer';
import mongoose from 'mongoose';
import { generateReadableId } from '../utils/idGenerator';

const normalizeDigits = (value: string): string => value.replace(/\D/g, '');

const startAndEndOfToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const checkinService = {
  lookupCustomer: async (input: { businessId: string; storeId: string; phone: string }) => {
    const customer = await CustomerModel.findOne({
      businessId: input.businessId,
      $or: [{ storeId: input.storeId }, { primaryStoreId: input.storeId }],
      phone: input.phone,
    }).lean();

    if (!customer) {
      return { customerExists: false };
    }

    const resolvedCustomerId = (customer as any).customerId || String((customer as any)._id || '');
    const latestCheckin = await CheckInModel.findOne({
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

  createCheckin: async (input: { businessId: string; storeId: string; customerId: string; phone?: string }) => {
    if (!input.customerId) {
      throw new Error('Customer ID is required');
    }

    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const customersCollection = mongoose.connection.db.collection<any>('customers');
    const objectIdCandidate = mongoose.Types.ObjectId.isValid(input.customerId)
      ? new mongoose.Types.ObjectId(input.customerId)
      : null;

    const customerIdFilters: Array<Record<string, unknown>> = [
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

    const resolvedCustomerId = String((customer as any).customerId || (customer as any)._id || input.customerId);
    const resolvedPhone = input.phone && input.phone.trim() ? input.phone : String((customer as any).phone || '');
    const checkinTimestamp = new Date();

    const checkinId = generateReadableId('checkin');
    const checkin = await CheckInModel.create({
      checkinId,
      businessId: input.businessId,
      storeId: input.storeId,
      customerId: resolvedCustomerId,
      phone: resolvedPhone,
      checkedInAt: checkinTimestamp,
    });

    await customersCollection.updateOne(
      {
        businessId: input.businessId,
        $or: [
          { customerId: resolvedCustomerId },
          { _id: (customer as any)._id },
        ],
      },
      {
        $set: { 'statistics.lastVisit': checkinTimestamp },
        $inc: { 'statistics.totalVisits': 1 },
      }
    );

    return {
      message: 'Check-in created successfully',
      customerExists: true,
      customer,
      checkin,
    };
  },

  authenticateStaff: async (input: { businessId: string; storeId: string; phone: string; pin: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const employeesCollection = mongoose.connection.db.collection('employees');
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

  getTodayCheckedInCustomers: async (input: { businessId: string; storeId: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const { start, end } = startAndEndOfToday();
    const checkins = await CheckInModel.find({
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
    const customersCollection = mongoose.connection.db.collection<any>('customers');
    const customers = await customersCollection
      .find({
      businessId: input.businessId,
      $or: [{ customerId: { $in: customerIds } }, { _id: { $in: customerIds } }],
      })
      .toArray();

    const customerById = new Map<string, any>();
    customers.forEach((item) => {
      if (item.customerId) {
        customerById.set(String(item.customerId), item);
      }

      if ((item as any)._id) {
        customerById.set(String((item as any)._id), item);
      }
    });

    const latestByCustomer = new Map<string, (typeof checkins)[number]>();
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

  getTechniciansByStore: async (input: { businessId: string; storeId: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const techniciansCollection = mongoose.connection.db.collection<any>('technicians');
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

  getInventoryByStore: async (input: { businessId: string; storeId: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const inventoryCollection = mongoose.connection.db.collection<any>('inventory');
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

  getServiceTypesByStore: async (input: { businessId: string; storeId: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const serviceTypeCollection = mongoose.connection.db.collection<any>('serviceType');
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
