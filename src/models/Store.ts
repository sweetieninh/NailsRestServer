import { Schema, model } from 'mongoose';

export interface StoreDocument {
  storeId: string;
  businessId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<StoreDocument>(
  {
    storeId: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const StoreModel = model<StoreDocument>('Store', StoreSchema);
