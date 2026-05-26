import { DataError, UnauthorizedError } from '@insight-ai/domain-models';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware } from '../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { UUID } from 'node:crypto';
import {
  RoleParamsSchema,
  RoleOrgParamsSchema,
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  RemovePermissionsBodySchema,
} from '../schemas/role.schema';

export function registerRoleRoutes(router: Router): void {
  const roleUseCase = inject(InPortType.RoleUseCase);

  router.post(
    '/api/v1/roles/:organizationId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = RoleOrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid organization ID.'));
      }
      const { organizationId } = paramsResult.data;

      const bodyResult = CreateRoleBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ?? 'Validation error.',
          ),
        );
      }
      const { name, parentRoleId, color, permissions } = bodyResult.data;

      roleUseCase
        .createRole(organizationId as UUID, req.session.idUser, {
          name,
          parentRoleId: parentRoleId as UUID,
          color,
          permissions,
        })
        .then((role) => res.status(200).json(role))
        .catch(next);
    },
  );

  router.put(
    '/api/v1/roles/:roleId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = RoleParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid role ID.'));
      }
      const { roleId } = paramsResult.data;

      const bodyResult = UpdateRoleBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ?? 'Validation error.',
          ),
        );
      }
      const { name, parentRoleId, color, permissions } = bodyResult.data;

      roleUseCase
        .updateRole(roleId as UUID, req.session.idUser, {
          name,
          parentRoleId: parentRoleId as UUID | undefined,
          color,
          permissions,
        })
        .then((role) => res.status(200).json(role))
        .catch(next);
    },
  );

  router.get(
    '/api/v1/roles/:organizationId/subordinate',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = RoleOrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid organization ID.'));
      }
      const { organizationId } = paramsResult.data;

      roleUseCase
        .listSubordinateRoles(organizationId as UUID, req.session.idUser)
        .then((roles) => res.status(200).json(roles))
        .catch(next);
    },
  );

  router.get(
    '/api/v1/roles/:organizationId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = RoleOrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid organization ID.'));
      }
      const { organizationId } = paramsResult.data;

      roleUseCase
        .listRoles(organizationId as UUID, req.session.idUser)
        .then((roles) => res.status(200).json(roles))
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/roles/:roleId/permissions',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = RoleParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid role ID.'));
      }
      const { roleId } = paramsResult.data;

      const bodyResult = RemovePermissionsBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ??
              'permissions must be an array of strings.',
          ),
        );
      }
      const { permissions } = bodyResult.data;

      roleUseCase
        .removePermissions(roleId as UUID, req.session.idUser, permissions)
        .then(() => res.status(200).json({ success: true }))
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/roles/:roleId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = RoleParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid role ID.'));
      }
      const { roleId } = paramsResult.data;

      roleUseCase
        .deleteRole(roleId as UUID, req.session.idUser)
        .then(() => res.status(200).json({ success: true }))
        .catch(next);
    },
  );
}
