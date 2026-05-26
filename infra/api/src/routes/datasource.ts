import {
  DataError,
  DatasourceType,
  UnauthorizedError,
} from '@insight-ai/domain-models';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware } from '../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { UUID } from 'node:crypto';
import {
  DatasourceOrgParamsSchema,
  DatasourceParamsSchema,
  TestConnectionBodySchema,
  CreateDatasourceBodySchema,
  ListDatasourcesQuerySchema,
} from '../schemas/datasource.schema';

export function registerDatasourceRoutes(router: Router): void {
  const datasourceUseCase = inject(InPortType.DatasourceUseCase);

  router.post(
    '/api/v1/datasources/:organizationId/test',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = DatasourceOrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid organization ID.'));
      }
      const { organizationId } = paramsResult.data;

      const bodyResult = TestConnectionBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ?? 'Validation error.',
          ),
        );
      }
      const {
        type,
        host,
        port,
        database,
        username,
        password,
        connectionString,
      } = bodyResult.data;

      if (!connectionString && !type) {
        return next(
          new DataError(
            'type must be one of: POSTGRESQL, MYSQL, SQLSERVER, ORACLE.',
          ),
        );
      }

      datasourceUseCase
        .testConnection(organizationId as UUID, req.session.idUser, {
          type: type as DatasourceType,
          host,
          port,
          database,
          username,
          password,
          connectionString,
        })
        .then((success) => res.status(200).json({ success }))
        .catch(next);
    },
  );

  router.post(
    '/api/v1/datasources/:organizationId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = DatasourceOrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid organization ID.'));
      }
      const { organizationId } = paramsResult.data;

      const bodyResult = CreateDatasourceBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return next(
          new DataError(
            bodyResult.error.issues[0]?.message ?? 'Validation error.',
          ),
        );
      }
      const {
        name,
        type,
        host,
        port,
        database,
        username,
        password,
        connectionString,
      } = bodyResult.data;

      if (!connectionString && !type) {
        return next(
          new DataError(
            'type must be one of: POSTGRESQL, MYSQL, SQLSERVER, ORACLE.',
          ),
        );
      }

      datasourceUseCase
        .createDatasource(organizationId as UUID, req.session.idUser, {
          name,
          type: type as DatasourceType,
          host,
          port,
          database,
          username,
          password,
          connectionString,
        })
        .then((datasource) => res.status(201).json(datasource))
        .catch(next);
    },
  );

  router.get(
    '/api/v1/datasources/:organizationId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = DatasourceOrgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return next(new DataError('Invalid organization ID.'));
      }
      const { organizationId } = paramsResult.data;

      const queryResult = ListDatasourcesQuerySchema.safeParse(req.query);
      const page = queryResult.success ? queryResult.data.page : 1;

      datasourceUseCase
        .listDatasources(organizationId as UUID, req.session.idUser, page)
        .then((result) => res.status(200).json(result))
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/datasources/:organizationId/:datasourceId',
    sessionMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = DatasourceParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        const firstError = paramsResult.error.issues[0];
        if (firstError?.path[0] === 'organizationId') {
          return next(new DataError('Invalid organization ID.'));
        }
        return next(new DataError('Invalid datasource ID.'));
      }
      const { datasourceId } = paramsResult.data;

      datasourceUseCase
        .deleteDatasource(datasourceId as UUID, req.session.idUser)
        .then(() => res.status(200).json({ success: true }))
        .catch(next);
    },
  );
}
