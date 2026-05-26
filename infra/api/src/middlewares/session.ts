import { InsightError } from '@insight-ai/domain-models';
import { inject, InPortType } from '@insight-ai/helper';
import { NextFunction, Request, Response } from 'express';

export function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sessionService = inject(InPortType.UserUseCase);
  const email = req.headers['x-user-email'] as string | undefined;

  if (!email) {
    return next(new InsightError('Email header is missing', 401));
  }

  sessionService
    .getUserByEmail(email)
    .then((user) => {
      if (!user) {
        return next(new InsightError('User not found', 404));
      }
      req.session = {
        idUser: user.idUser,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
      };
      next();
    })
    .catch(next);
}
