import express, { Router } from 'express';
import { registerOrganizationRoutes } from './organization';
import { regiterSessionRoutes } from './session';
import { healthCheckHandler } from './health';
import { registerRoleRoutes } from './role';
import { registerDatasourceRoutes } from './datasource';

export const getMainRouter = (): Router => {
  const router = express.Router();

  router.get('/api/v1/health', healthCheckHandler);
  regiterSessionRoutes(router);
  registerOrganizationRoutes(router);
  registerRoleRoutes(router);
  registerDatasourceRoutes(router);

  return router;
};
