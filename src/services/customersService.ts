import { CheckInModel } from '../models/CheckIn';
import { CustomerModel } from '../models/Customer';
import { generateReadableId } from '../utils/idGenerator';

export const customersService = {
  registerCustomer: async (input: {
    businessId: string;
    storeId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    birthday: string;
    allowSMS: boolean;
    allowEmail: boolean;
  }) => {
    const existingCustomer = await CustomerModel.findOne({
      businessId: input.businessId,
      storeId: input.storeId,
      phone: input.phone,
    });

    if (existingCustomer) {
      throw new Error('Customer already exists for this business and store');
    }

    const customerId = generateReadableId('cust');
    const customer = await CustomerModel.create({
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

    const checkinId = generateReadableId('checkin');
    const checkin = await CheckInModel.create({
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
