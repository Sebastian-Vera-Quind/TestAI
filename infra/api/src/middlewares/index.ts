import { errorMiddleware } from './error';
import { sessionMiddleware } from './session';
import { transactionMiddleware } from './transaction';
import { traceMiddleware } from './trace';
import { json } from 'express';
import cookie from 'cookie-parser';
import cors from 'cors';

export const standardMiddlewares = [
  json(),
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: process.env.NODE_ENV === 'production',
  }),
  cookie(),
  transactionMiddleware,
  traceMiddleware,
];

export { sessionMiddleware, errorMiddleware };
