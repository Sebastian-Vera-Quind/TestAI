import { DataError, UnauthorizedError } from '@insight-ai/domain-models';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware } from '../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { UUID } from 'node:crypto';
import {
  OrgParamsSchema,
  CreateOrganizationBodySchema,
  EditOrganizationBodySchema,
  AddMemberBodySchema,
  RemoveMemberBodySchema,
  SearchOrgQuerySchema,
  ListOrgQuerySchema,
} from '../schemas/organization.schema';

export function registerOrganizationRoutes(router: Router): void {
  const organizationUseCase = inject(InPortType.OrganizationUseCase);

  router.post(
    '/api/v1/organizations',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const bodyResult = CreateOrganizationBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ??
              'Organization name is required.',
          ),
        );
      }
      const { name } = bodyResult.data;

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
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const queryResult = SearchOrgQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return next(
          new DataError(
            queryResult.error.issues[0]?.message ?? 'Search name is required.',
          ),
        );
      }
      const { name, page } = queryResult.data;

      organizationUseCase
        .searchOrganizationsByName(req.session.idUser, name.trim(), page)
        .then((organizations) => {
          res.status(200).json(organizations);
        })
        .catch(next);
    },
  );

  router.get(
    '/api/v1/organizations',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const queryResult = ListOrgQuerySchema.safeParse(req.query);
      const page = queryResult.success ? queryResult.data.page : 1;

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
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = OrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('A valid organization ID is required.'));
      }

      const { organizationId } = paramsResult.data as { organizationId: UUID };

      const bodyResult = EditOrganizationBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ??
              'Organization name is required.',
          ),
        );
      }

      const { name } = bodyResult.data;

      organizationUseCase
        .editOrganization(organizationId, req.session.idUser, name)
        .then((organization) => {
          res.status(200).json({ organization });
        })
        .catch(next);
    },
  );

  router.put(
    '/api/v1/organizations/:organizationId/favorite',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = OrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('A valid organization ID is required.'));
      }
      const { organizationId } = paramsResult.data as { organizationId: UUID };

      organizationUseCase
        .toggleFavoriteOrganization(organizationId, req.session.idUser)
        .then((isFavorite) => {
          res.status(200).json({ isFavorite });
        })
        .catch(next);
    },
  );

  router.put(
    '/api/v1/organizations/:organizationId/favorite',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = OrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('A valid organization ID is required.'));
      }
      const { organizationId } = paramsResult.data as { organizationId: UUID };

      organizationUseCase
        .toggleFavoriteOrganization(organizationId, req.session.idUser)
        .then((isFavorite) => {
          res.status(200).json({ isFavorite });
        })
        .catch(next);
    },
  );

  router.post(
    '/api/v1/organizations/:organizationId/members',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = OrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('A valid organization ID is required.'));
      }
      const { organizationId } = paramsResult.data as { organizationId: UUID };

      const bodyResult = AddMemberBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ??
              'email and roleId are required.',
          ),
        );
      }
      const { email, roleId } = bodyResult.data;

      organizationUseCase
        .addMember(
          organizationId,
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
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = OrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('A valid organization ID is required.'));
      }
      const { organizationId } = paramsResult.data;

      const bodyResult = RemoveMemberBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ?? 'userId is required.',
          ),
        );
      }
      const { userId } = bodyResult.data;

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
