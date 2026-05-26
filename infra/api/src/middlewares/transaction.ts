import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export const transactionMiddleware = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  req.transaction = {
    ...req.transaction,
    transactionId: randomUUID(),
  };

  next();
};
