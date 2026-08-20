import { Request, Response } from 'express';

import { config } from '../config';

export const healthController = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'NailsRestServer',
    port: config.port,
    timestamp: new Date().toISOString(),
  });
};
