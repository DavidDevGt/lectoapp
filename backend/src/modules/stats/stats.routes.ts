import { Router } from 'express';
import { StatsController } from './stats.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { dashboardQuerySchema } from './stats.validator';
import { UserRole } from '../../generated/prisma';

export function createStatsRoutes(controller: StatsController): Router {
  const router = Router();

  router.get(
    '/dashboard',
    authenticate,
    authorize(UserRole.ADMIN),
    validate(dashboardQuerySchema, 'query'),
    controller.dashboard,
  );

  return router;
}
