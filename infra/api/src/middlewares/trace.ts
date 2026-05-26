import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

export function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info(
      {
        type: 'http_request',
        timestamp: new Date().toISOString(),
        transactionId: req.transaction?.transactionId,
        method: req.method,
        url: req.originalUrl,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        path: req.route?.path,
        statusCode: res.statusCode,
        duration,

        userEmail: req.session?.email,
        authenticated: !!req.session?.email,
        userAgent: req.headers['user-agent'],
      },
      'http_request',
    );
  });

  next();
}
