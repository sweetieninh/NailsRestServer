import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../config';

export const connectDB = async (): Promise<void> => {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  if (process.env.USE_DNS_FALLBACK === 'true') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log('Using DNS fallback servers: 8.8.8.8, 1.1.1.1');
  }

  await mongoose.connect(config.mongoUri, {
    dbName: config.dbName,
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });

  console.log(`Connected to MongoDB database: ${config.dbName}`);
};
