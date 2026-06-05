import express, { Router } from 'express';
import { registerOrganizationRoutes } from './organization/organization.router';
import { regiterSessionRoutes } from './session/session.router';
import { healthCheckHandler } from './health';
import { registerRoleRoutes } from './role/role.router';
import { registerDatasourceRoutes } from './datasource/datasource.router';

export const getMainRouter = (): Router => {
  const router = express.Router();

  router.get('/api/v1/health', healthCheckHandler);
  regiterSessionRoutes(router);
  registerOrganizationRoutes(router);
  registerRoleRoutes(router);
  registerDatasourceRoutes(router);

  return router;
};
