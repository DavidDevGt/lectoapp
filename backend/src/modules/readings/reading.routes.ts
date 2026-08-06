import { Router } from 'express';
import { ReadingController } from './reading.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createReadingSchema, readingQuerySchema, updateReadingSchema } from './reading.validator';
import { UserRole } from '../../generated/prisma';

export function createReadingRoutes(controller: ReadingController): Router {
  const router = Router();

  router.get('/', authenticate, validate(readingQuerySchema, 'query'), controller.list);

  router.get('/:id', authenticate, controller.getById);

  router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN),
    validate(createReadingSchema),
    controller.create,
  );

  router.put(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN),
    validate(updateReadingSchema),
    controller.update,
  );

  router.patch('/:id/publish', authenticate, authorize(UserRole.ADMIN), controller.publish);

  router.patch('/:id/archive', authenticate, authorize(UserRole.ADMIN), controller.archive);

  router.delete('/:id', authenticate, authorize(UserRole.ADMIN), controller.softDelete);

  return router;
}
