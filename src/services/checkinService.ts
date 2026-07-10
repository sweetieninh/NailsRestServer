import { CheckInModel } from '../models/CheckIn';
import { CustomerModel } from '../models/Customer';
import { generateReadableId } from '../utils/idGenerator';

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

    return {
      customerExists: true,
      customer,
    };
  },

  createCheckin: async (input: { businessId: string; storeId: string; customerId: string; phone: string }) => {
    const customer = await CustomerModel.findOne({
      businessId: input.businessId,
      storeId: input.storeId,
      customerId: input.customerId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const checkinId = generateReadableId('checkin');
    const checkin = await CheckInModel.create({
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
