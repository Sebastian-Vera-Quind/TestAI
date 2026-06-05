import {
  DataError,
  DatasourceType,
  UnauthorizedError,
} from '@insight-ai/domain-models';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware, validateMiddleware } from '../../middlewares';
import { inject, InPortType } from '@insight-ai/helper';
import { UUID } from 'node:crypto';
import { z } from '../../schemas/registry';
import {
  CreateDatasourceBody,
  Datasource,
  DatasourceParams,
  DatasourcePage,
  ListDatasourcesQuery,
  TestConnectionBody,
} from './datasource.schema';
import { OrgParams } from '../organization/organization.schema';

export function registerDatasourceRoutes(router: Router): void {
  const datasourceUseCase = inject(InPortType.DatasourceUseCase);

  router.post(
    '/api/v1/datasources/:organizationId/test',
    sessionMiddleware,
    validateMiddleware({
      method: 'post',
      fullPath: '/api/v1/datasources/{organizationId}/test',
      summary: 'Test datasource connection',
      tags: ['Datasource'],
      params: OrgParams,
      body: { schema: TestConnectionBody },
      responses: {
        200: {
          description: 'Connection test result',
          content: { 'application/json': z.object({ success: z.boolean() }) },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const body = req.body as z.infer<typeof TestConnectionBody>;

      if (!body.connectionString && !body.type) {
        return next(
          new DataError(
            'type must be one of: POSTGRESQL, MYSQL, SQLSERVER, ORACLE.',
          ),
        );
      }

      datasourceUseCase
        .testConnection(organizationId as UUID, req.session.idUser, {
          type: body.type as DatasourceType,
          host: body.host,
          port: body.port,
          database: body.database,
          username: body.username,
          password: body.password,
          connectionString: body.connectionString,
        })
        .then((success) => res.status(200).json({ success }))
        .catch(next);
    },
  );

  router.post(
    '/api/v1/datasources/:organizationId',
    sessionMiddleware,
    validateMiddleware({
      method: 'post',
      fullPath: '/api/v1/datasources/{organizationId}',
      summary: 'Create datasource',
      tags: ['Datasource'],
      params: OrgParams,
      body: { schema: CreateDatasourceBody },
      responses: {
        201: {
          description: 'Datasource created',
          content: { 'application/json': Datasource },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const body = req.body as z.infer<typeof CreateDatasourceBody>;

      if (!body.connectionString && !body.type) {
        return next(
          new DataError(
            'type must be one of: POSTGRESQL, MYSQL, SQLSERVER, ORACLE.',
          ),
        );
      }

      datasourceUseCase
        .createDatasource(organizationId as UUID, req.session.idUser, {
          name: body.name,
          type: body.type as DatasourceType,
          host: body.host,
          port: body.port,
          database: body.database,
          username: body.username,
          password: body.password,
          connectionString: body.connectionString,
        })
        .then((datasource) => res.status(201).json(datasource))
        .catch(next);
    },
  );

  router.get(
    '/api/v1/datasources/:organizationId',
    sessionMiddleware,
    validateMiddleware({
      method: 'get',
      fullPath: '/api/v1/datasources/{organizationId}',
      summary: 'List datasources',
      tags: ['Datasource'],
      params: OrgParams,
      query: ListDatasourcesQuery,
      responses: {
        200: {
          description: 'Datasources listed',
          content: { 'application/json': DatasourcePage },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const { organizationId } = req.params as z.infer<typeof OrgParams>;
      const { page } = req.query as { page?: number };

      datasourceUseCase
        .listDatasources(organizationId as UUID, req.session.idUser, page)
        .then((result) => res.status(200).json(result))
        .catch(next);
    },
  );

  router.delete(
    '/api/v1/datasources/:organizationId/:datasourceId',
    sessionMiddleware,
    validateMiddleware({
      method: 'delete',
      fullPath: '/api/v1/datasources/{organizationId}/{datasourceId}',
      summary: 'Delete datasource',
      tags: ['Datasource'],
      params: DatasourceParams,
      responses: {
        200: {
          description: 'Datasource deleted',
          content: { 'application/json': z.object({ success: z.boolean() }) },
        },
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.session) {
        return next(new UnauthorizedError('No active session found.'));
      }

      const paramsResult = DatasourceParams.safeParse(req.params);
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
