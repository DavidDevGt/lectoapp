import { Router } from 'express';
import { ProgressController } from './progress.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { submitProgressSchema } from './progress.validator';
import { UserRole } from '../../generated/prisma';

export function createProgressRoutes(controller: ProgressController): Router {
  const router = Router();

  router.post(
    '/submit',
    authenticate,
    authorize(UserRole.STUDENT),
    validate(submitProgressSchema),
    controller.submit,
  );

  router.get('/me', authenticate, authorize(UserRole.STUDENT), controller.me);

  router.get(
    '/reading/:readingId',
    authenticate,
    authorize(UserRole.STUDENT),
    controller.byReading,
  );

  return router;
}
