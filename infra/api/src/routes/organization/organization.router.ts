import { UnauthorizedError } from '@insight-ai/domain-models';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware, validateMiddleware } from '../../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { UUID } from 'node:crypto';
import { z } from '../../schemas/registry';
import {
  AddMemberBody,
  CreateMemberResponse,
  CreateOrganizationResponse,
  OrganizationCreateBody,
  FavoriteOrganization,
  ListOrgQuery,
  OrgParams,
  OrganizationPage,
  RemoveMemberBody,
  SearchOrgQuery,
  UpdateOrganizationResponse,
} from './organization.schema';

export function registerOrganizationRoutes(router: Router): void {
  const organizationUseCase = inject(InPortType.OrganizationUseCase);

  router.post(
    '/api/v1/organizations',
    sessionMiddleware,
    validateMiddleware({
      method: 'post',
      fullPath: '/api/v1/organizations',
      summary: 'Create organization',
      tags: ['Organization'],
      body: {
        schema: OrganizationCreateBody,
        required: true,
        contentType: 'multipart/form-data',
      },
      responses: {
        201: {
          description: 'Organization created successfully',
          content: {
            'application/json': CreateOrganizationResponse,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { name } = req.body as z.infer<typeof OrganizationCreateBody>;

      organizationUseCase
        .createOrganization(name, req.session.idUser)
        .then((organization) => {
          res.status(201).json({ organization });
        })
        .catch(next);
    },
  );

  router.get(
    '/api/v1/organizations/search',
    sessionMiddleware,
    validateMiddleware({
      method: 'get',
      fullPath: '/api/v1/organizations/search',
      summary: 'Search organizations by name',
      tags: ['Organization'],
      query: SearchOrgQuery,
      responses: {
        200: {
          description: 'Organizations found successfully',
          content: {
            'application/json': OrganizationPage,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { name, page } = req.query as { name?: string; page?: number };

      organizationUseCase
        .searchOrganizationsByName(req.session.idUser, name!.trim(), page)
        .then((organizations) => {
          res.status(200).json(organizations);
        })
        .catch(next);
    },
  );

  router.get(
    '/api/v1/organizations',
    sessionMiddleware,
    validateMiddleware({
      method: 'get',
      fullPath: '/api/v1/organizations',
      summary: 'List user organizations',
      tags: ['Organization'],
      query: ListOrgQuery,
      responses: {
        200: {
          description: 'Organizations listed successfully',
          content: {
            'application/json': OrganizationPage,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { page } = req.query as { page?: number };

      organizationUseCase
        .listOrganizationsByUser(req.session.idUser, page)
        .then((organizations) => {
          res.status(200).json(organizations);
        })
        .catch(next);
    },
  );

  router.put(
    '/api/v1/organizations/:organizationId',
    sessionMiddleware,
    validateMiddleware({
      method: 'put',
      fullPath: '/api/v1/organizations/{organizationId}',
      summary: 'Edit organization',
      tags: ['Organization'],
      params: OrgParams,
      body: {
        schema: OrganizationCreateBody,
        required: true,
        contentType: 'multipart/form-data',
      },
      responses: {
        200: {
          description: 'Organization updated successfully',
          content: {
            'application/json': UpdateOrganizationResponse,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const { name } = req.body as z.infer<typeof OrganizationCreateBody>;

      organizationUseCase
        .editOrganization(organizationId as UUID, req.session.idUser, name)
        .then((organization) => {
          res.status(200).json({ organization });
        })
        .catch(next);
    },
  );

  router.put(
    '/api/v1/organizations/:organizationId/favorite',
    sessionMiddleware,
    validateMiddleware({
      method: 'put',
      fullPath: '/api/v1/organizations/{organizationId}/favorite',
      summary: 'Toggle favorite organization',
      tags: ['Organization'],
      params: OrgParams,
      responses: {
        200: {
          description: 'Organization favorite status toggled',
          content: {
            'application/json': FavoriteOrganization,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;

      organizationUseCase
        .toggleFavoriteOrganization(organizationId as UUID, req.session.idUser)
        .then((isFavorite) => {
          res.status(200).json({ isFavorite });
        })
        .catch(next);
    },
  );

  router.post(
    '/api/v1/organizations/:organizationId/members',
    sessionMiddleware,
    validateMiddleware({
      method: 'post',
      fullPath: '/api/v1/organizations/{organizationId}/members',
      summary: 'Add organization member',
      tags: ['Organization'],
      params: OrgParams,
      body: {
        schema: AddMemberBody,
        required: true,
      },
      responses: {
        201: {
          description: 'Member added successfully',
          content: {
            'application/json': CreateMemberResponse,
          },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const { email, roleId } = req.body as z.infer<typeof AddMemberBody>;

      organizationUseCase
        .addMember(
          organizationId as UUID,
          req.session.idUser,
          email.trim().toLowerCase(),
          roleId as UUID,
        )
        .then((member) => {
          res.status(201).json({ member });
        })
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/organizations/:organizationId/members',
    sessionMiddleware,
    validateMiddleware({
      method: 'delete',
      fullPath: '/api/v1/organizations/{organizationId}/members',
      summary: 'Remove organization member',
      tags: ['Organization'],
      params: OrgParams,
      body: {
        schema: RemoveMemberBody,
        required: true,
      },
      responses: {
        204: {
          description: 'Member removed successfully',
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const { userId } = req.body as z.infer<typeof RemoveMemberBody>;

      organizationUseCase
        .removeMember(
          organizationId as UUID,
          req.session.idUser,
          userId as UUID,
        )
        .then(() => {
          res.status(204).send();
        })
        .catch(next);
    },
  );
}
