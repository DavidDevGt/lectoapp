import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateMeSchema, userQuerySchema } from './user.validator';
import { UserRole } from '../../generated/prisma';

export function createUserRoutes(controller: UserController): Router {
  const router = Router();

  router.get('/me', authenticate, controller.me);

  router.put('/me', authenticate, validate(updateMeSchema), controller.updateMe);

  router.get(
    '/',
    authenticate,
    authorize(UserRole.ADMIN),
    validate(userQuerySchema, 'query'),
    controller.list,
  );

  return router;
}
