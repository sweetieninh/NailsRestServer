import { Schema, model } from 'mongoose';

export interface SettingDocument {
  businessId: string;
  storeId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<SettingDocument>(
  {
    businessId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

SettingSchema.index({ businessId: 1, storeId: 1, key: 1 }, { unique: true });

export const SettingModel = model<SettingDocument>('Setting', SettingSchema);
