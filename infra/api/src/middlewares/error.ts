import { InsightError } from '@insight-ai/domain-models';
import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export const errorMiddleware: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: NextFunction,
) => {
  logger.error(
    {
      type: 'http_error',
      timestamp: new Date().toISOString(),
      transactionId: req.transaction?.transactionId,
      method: req.method,
      url: req.originalUrl,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      path: req.route?.path,
      statusCode: error instanceof InsightError ? error.getCode() : 500,
      err: error,
    },
    'http_error',
  );

  if (error instanceof InsightError) {
    res.status(error.getCode()).send({
      error: error.name,
      message: error.message,
      code: error.getCode(),
    });
    return;
  }

  const transactionId = req.transaction?.transactionId;

  res.status(500).send({
    error: 'InternalError',
    message: `An internal error occurred (Transaction ID: ${transactionId})`,
  });
};
