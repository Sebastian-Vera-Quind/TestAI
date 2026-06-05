import { UnauthorizedError } from '@insight-ai/domain-models';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware, validateMiddleware } from '../../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { UUID } from 'node:crypto';
import { z } from '../../schemas/registry';
import {
  CreateRoleBody,
  CreateRoleResponse,
  RolePage,
  RoleParams,
  RemovePermissionsBody,
  UpdateRoleResponse,
  UpdateRoleBody,
} from './role.schema';
import { OrgParams } from '../organization/organization.schema';

export function registerRoleRoutes(router: Router): void {
  const roleUseCase = inject(InPortType.RoleUseCase);

  router.post(
    '/api/v1/roles/:organizationId',
    sessionMiddleware,
    validateMiddleware({
      method: 'post',
      fullPath: '/api/v1/roles/{organizationId}',
      summary: 'Create role for organization',
      tags: ['Role'],
      params: OrgParams,
      body: {
        schema: CreateRoleBody,
      },
      responses: {
        200: {
          description: 'Role created successfully',
          content: { 'application/json': CreateRoleResponse },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const { name, parentRoleId, color, permissions } = req.body as z.infer<
        typeof CreateRoleBody
      >;

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
    validateMiddleware({
      method: 'put',
      fullPath: '/api/v1/roles/{roleId}',
      summary: 'Update role',
      tags: ['Role'],
      params: RoleParams,
      body: { schema: UpdateRoleBody },
      responses: {
        200: {
          description: 'Role updated successfully',
          content: { 'application/json': UpdateRoleResponse },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { roleId } = req.params as z.infer<typeof RoleParams>;
      const { name, parentRoleId, color, permissions } = req.body as z.infer<
        typeof UpdateRoleBody
      >;

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
    validateMiddleware({
      method: 'get',
      fullPath: '/api/v1/roles/{organizationId}/subordinate',
      summary: 'List subordinate roles',
      tags: ['Role'],
      params: OrgParams,
      responses: {
        200: {
          description: 'Subordinate roles listed',
          content: { 'application/json': RolePage },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;

      roleUseCase
        .listSubordinateRoles(organizationId as UUID, req.session.idUser)
        .then((roles) => res.status(200).json(roles))
        .catch(next);
    },
  );

  router.get(
    '/api/v1/roles/:organizationId',
    sessionMiddleware,
    validateMiddleware({
      method: 'get',
      fullPath: '/api/v1/roles/{organizationId}',
      summary: 'List roles for organization',
      tags: ['Role'],
      params: OrgParams,
      responses: {
        200: {
          description: 'Roles listed',
          content: { 'application/json': RolePage },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;

      roleUseCase
        .listRoles(organizationId as UUID, req.session.idUser)
        .then((roles) => res.status(200).json(roles))
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/roles/:roleId/permissions',
    sessionMiddleware,
    validateMiddleware({
      method: 'delete',
      fullPath: '/api/v1/roles/{roleId}/permissions',
      summary: 'Remove permissions from role',
      tags: ['Role'],
      params: RoleParams,
      body: { schema: RemovePermissionsBody },
      responses: {
        200: {
          description: 'Permissions removed',
          content: { 'application/json': z.object({ success: z.boolean() }) },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { roleId } = req.params as z.infer<typeof RoleParams>;
      const { permissions } = req.body as z.infer<typeof RemovePermissionsBody>;

      roleUseCase
        .removePermissions(roleId as UUID, req.session.idUser, permissions)
        .then(() => res.status(200).json({ success: true }))
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/roles/:roleId',
    sessionMiddleware,
    validateMiddleware({
      method: 'delete',
      fullPath: '/api/v1/roles/{roleId}',
      summary: 'Delete role',
      tags: ['Role'],
      params: RoleParams,
      responses: {
        200: {
          description: 'Role deleted',
          content: { 'application/json': z.object({ success: z.boolean() }) },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { roleId } = req.params as z.infer<typeof RoleParams>;

      roleUseCase
        .deleteRole(roleId as UUID, req.session.idUser)
        .then(() => res.status(200).json({ success: true }))
        .catch(next);
    },
  );
}
