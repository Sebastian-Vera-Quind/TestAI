import { Request, Router, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@insight-ai/domain-models';
import { sessionMiddleware, validateMiddleware } from '../../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { CreateUserBody, UserSchema } from './session.schema';
import { z } from '../../schemas/registry';

export function regiterSessionRoutes(router: Router): void {
  const userUsecase = inject(InPortType.UserUseCase);

  router.post(
    '/api/v1/account',
    sessionMiddleware,
    validateMiddleware({
      method: 'post',
      fullPath: '/api/v1/account',
      summary: 'Create a new user account',
      tags: ['Session'],
      secure: false,
      body: {
        schema: CreateUserBody,
        required: true,
        contentType: 'multipart/form-data',
      },
      responses: {
        201: {
          description: 'User account created successfully',
          content: {
            'application/json': UserSchema,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      const { name, email } = req.body as z.infer<typeof CreateUserBody>;

      userUsecase
        .createUser(name, email)
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
    validateMiddleware({
      method: 'get',
      fullPath: '/api/v1/account',
      summary: 'Get current user account information',
      tags: ['Session'],
      responses: {
        200: {
          description:
            'Current user account information retrieved successfully',
          content: {
            'application/json': UserSchema,
          },
        },
      },
    }),
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
