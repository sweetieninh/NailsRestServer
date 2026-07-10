import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4020),
  host: process.env.HOST || '192.168.9.152',
  mongoUri: process.env.MONGO_URI || '',
  dbName: process.env.DB_NAME || 'NailsDB',
};
