import { Schema, model } from 'mongoose';

export interface BusinessDocument {
  businessId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<BusinessDocument>(
  {
    businessId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const BusinessModel = model<BusinessDocument>('Business', BusinessSchema);
