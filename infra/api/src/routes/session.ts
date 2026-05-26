import { Request, Router, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@insight-ai/domain-models';
import { sessionMiddleware } from '../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { CreateUserBodySchema } from '../schemas/session.schema';

export function regiterSessionRoutes(router: Router): void {
  const userUsecase = inject(InPortType.UserUseCase);

  router.post(
    '/api/v1/account',
    (req: Request, res: Response, next: NextFunction) => {
      const bodyResult = CreateUserBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          error:
            bodyResult.error.issues[0]?.message ??
            'Email and name are required.',
        });
      }
      const { email, name, imageUrl } = bodyResult.data;

      userUsecase
        .createUser(name, email, imageUrl)
        .then(async (userId) => {
          const user = await userUsecase.getUserById(userId);
          res.status(201).json({
            idUser: userId,
            email: user.email,
            name: user.name,
            imageUrl: user.imageUrl,
          });
        })
        .catch(next);
    },
  );

  router.get(
    '/api/v1/account',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      res.json({
        idUser: req.session.idUser,
        email: req.session.email,
        name: req.session.name,
        imageUrl: req.session.imageUrl,
      });
    },
  );
}
