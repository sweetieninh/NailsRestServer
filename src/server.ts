import os from 'os';
import app from './app';
import { connectDB } from './db';
import { config } from './config';

const getLanAddress = (): string => {
  const nets = os.networkInterfaces();
  for (const ifaceList of Object.values(nets)) {
    for (const iface of ifaceList ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
};

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, config.host, () => {
    // config.host may be 0.0.0.0 (all interfaces), so log an address that's actually reachable
    const displayHost = config.host === '0.0.0.0' ? getLanAddress() : config.host;
    console.log(`NailsRestServer listening on http://${displayHost}:${config.port}`);
  });
};

void startServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
