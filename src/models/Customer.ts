import { Schema, model } from 'mongoose';

export interface CustomerDocument {
  customerId: string;
  businessId: string;
  storeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  allowSMS: boolean;
  allowEmail: boolean;
  statistics: {
    lastVisit?: Date;
    totalVisits: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    customerId: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    birthday: { type: String, required: true },
    allowSMS: { type: Boolean, required: true },
    allowEmail: { type: Boolean, required: true },
    statistics: {
      lastVisit: { type: Date },
      totalVisits: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ businessId: 1, storeId: 1, phone: 1 }, { unique: true });

export const CustomerModel = model<CustomerDocument>('Customer', CustomerSchema);
