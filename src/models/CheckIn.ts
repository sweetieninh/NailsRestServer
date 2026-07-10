import { Schema, model } from 'mongoose';

export interface CheckInDocument {
  checkinId: string;
  businessId: string;
  storeId: string;
  customerId: string;
  phone: string;
  checkedInAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<CheckInDocument>(
  {
    checkinId: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CheckInModel = model<CheckInDocument>('CheckIn', CheckInSchema);
