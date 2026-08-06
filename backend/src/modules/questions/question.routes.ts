import { Router } from 'express';
import { QuestionController } from './question.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createQuestionSchema, questionQuerySchema, updateQuestionSchema } from './question.validator';
import { UserRole } from '../../generated/prisma';

export function createQuestionRoutes(controller: QuestionController): Router {
  const router = Router({ mergeParams: true });

  router.get('/', authenticate, validate(questionQuerySchema, 'query'), controller.list);

  router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN),
    validate(createQuestionSchema),
    controller.create,
  );

  router.put(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN),
    validate(updateQuestionSchema),
    controller.update,
  );

  router.delete('/:id', authenticate, authorize(UserRole.ADMIN), controller.delete);

  router.patch('/:id/approve', authenticate, authorize(UserRole.ADMIN), controller.approve);

  return router;
}
