import app from './app';
import { connectDB } from './db';
import { config } from './config';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, config.host, () => {
    console.log(`NailsRestServer listening on http://${config.host}:${config.port}`);
  });
};

void startServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
