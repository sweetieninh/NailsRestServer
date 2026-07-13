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

const startOfWeekMonday = (source: Date) => {
  const date = new Date(source);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonth = (source: Date) => {
  const date = new Date(source.getFullYear(), source.getMonth(), 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDateOnly = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const nextDay = (source: Date) => {
  const date = new Date(source);
  date.setDate(date.getDate() + 1);
  return date;
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

  authenticateManager: async (input: { businessId: string; storeId: string; phone: string; pin: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const employeesCollection = mongoose.connection.db.collection('employees');
    const normalizedPhone = normalizeDigits(input.phone);

    const managerCandidates = await employeesCollection
      .find({
        businessId: input.businessId,
        managerOfStoreId: input.storeId,
        passcode: input.pin,
      })
      .toArray();

    const manager = managerCandidates.find(
      (candidate) => normalizeDigits(String(candidate.phone ?? '')) === normalizedPhone
    );

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

  getActiveCustomerCart: async (input: { businessId: string; storeId: string; customerId: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const cartCollection = mongoose.connection.db.collection<any>('customerCart');
    const cart = await cartCollection.findOne({
      businessId: input.businessId,
      storeId: input.storeId,
      customerId: input.customerId,
      status: 'ACTIVE',
    });

    return { cart: cart || null };
  },

  saveCustomerCart: async (input: {
    businessId: string;
    storeId: string;
    customerId: string;
    customerFirstName?: string;
    customerLastName?: string;
    technicianId?: string;
    services: Array<{ serviceTypeId: string; serviceType: string; unitPrice: number; isCustomPrice?: boolean }>;
    inventoryItems: Array<{ inventoryId: string; itemName: string; unitPrice: number; category?: string }>;
    pricing: { subtotal: number; total: number };
    currency?: string;
  }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const cartCollection = mongoose.connection.db.collection<any>('customerCart');
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
        cartId: generateReadableId('cart'),
        createdAt: timestamp,
      },
    };

    await cartCollection.findOneAndUpdate(
      {
        businessId: input.businessId,
        storeId: input.storeId,
        customerId: input.customerId,
        status: 'ACTIVE',
      },
      update,
      { upsert: true, returnDocument: 'after' }
    );

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

  checkoutCustomerCart: async (input: { businessId: string; storeId: string; customerId: string }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const cartCollection = mongoose.connection.db.collection<any>('customerCart');
    const orderCollection = mongoose.connection.db.collection<any>('customerOrder');
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
      orderId: generateReadableId('order'),
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
    await cartCollection.updateOne(
      { _id: cart._id },
      {
        $set: {
          status: 'CHECKED_OUT',
          orderId: order.orderId,
          checkedOutAt: timestamp,
          updatedAt: timestamp,
        },
      }
    );

    return {
      message: 'Checkout completed successfully',
      order,
    };
  },

  getStoreReport: async (input: {
    businessId: string;
    storeId: string;
    reportType: 'today' | 'week' | 'month' | 'custom';
    showDetails: boolean;
    startDate?: string;
    endDate?: string;
  }) => {
    if (!mongoose.connection.db) {
      throw new Error('Database is not connected');
    }

    const now = new Date();
    let rangeStart: Date;
    let rangeEndExclusive: Date;

    if (input.reportType === 'today') {
      const { start, end } = startAndEndOfToday();
      rangeStart = start;
      rangeEndExclusive = end;
    } else if (input.reportType === 'week') {
      rangeStart = startOfWeekMonday(now);
      const weekEnd = new Date(rangeStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      rangeEndExclusive = weekEnd;
    } else if (input.reportType === 'month') {
      rangeStart = startOfMonth(now);
      const endOfTodayExclusive = nextDay(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      rangeEndExclusive = endOfTodayExclusive;
    } else {
      const parsedStart = input.startDate ? parseDateOnly(input.startDate) : null;
      const parsedEnd = input.endDate ? parseDateOnly(input.endDate) : null;
      if (!parsedStart || !parsedEnd) {
        throw new Error('Invalid custom date range');
      }
      rangeStart = parsedStart;
      rangeEndExclusive = nextDay(parsedEnd);
    }

    const orderCollection = mongoose.connection.db.collection<any>('customerOrder');
    const orders = await orderCollection
      .find({
        businessId: input.businessId,
        storeId: input.storeId,
        status: 'COMPLETED',
        'payment.status': 'PAID',
        createdAt: { $gte: rangeStart, $lt: rangeEndExclusive },
      })
      .toArray();

    const totalAmount = orders.reduce((sum, order) => sum + Number(order?.pricing?.total || 0), 0);

    let technicianBreakdown: Array<{
      technicianId: string;
      firstName: string;
      lastName: string;
      subtotal: number;
    }> = [];

    if (input.showDetails) {
      const subtotalByTech = new Map<string, number>();
      orders.forEach((order) => {
        const techId = String(order.technicianId || '');
        if (!techId) {
          return;
        }
        const current = subtotalByTech.get(techId) || 0;
        subtotalByTech.set(techId, current + Number(order?.pricing?.total || 0));
      });

      const techIds = Array.from(subtotalByTech.keys());
      const techniciansCollection = mongoose.connection.db.collection<any>('technicians');
      const technicians = await techniciansCollection
        .find({
          businessId: input.businessId,
          storeId: input.storeId,
          $or: [{ technicianId: { $in: techIds } }, { _id: { $in: techIds } }],
        })
        .toArray();

      const techById = new Map<string, any>();
      technicians.forEach((item) => {
        if (item.technicianId) {
          techById.set(String(item.technicianId), item);
        }
        if (item._id) {
          techById.set(String(item._id), item);
        }
      });

      technicianBreakdown = techIds
        .map((techId) => {
          const tech = techById.get(techId);
          return {
            technicianId: techId,
            firstName: String(tech?.firstName || 'Unknown'),
            lastName: String(tech?.lastName || ''),
            subtotal: Number(subtotalByTech.get(techId) || 0),
          };
        })
        .sort((a, b) => b.subtotal - a.subtotal);
    }

    return {
      reportType: input.reportType,
      from: rangeStart,
      to: new Date(rangeEndExclusive.getTime() - 1),
      totalAmount,
      technicianBreakdown,
    };
  },
};
