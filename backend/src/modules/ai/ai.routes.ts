import { Router } from 'express';
import { AiController } from './ai.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { aiRateLimiter } from '../../middleware/rate-limiter.middleware';
import { generateQuestionsSchema } from './ai.validator';
import { UserRole } from '../../generated/prisma';

export function createAiRoutes(controller: AiController): Router {
  const router = Router();

  router.post(
    '/generate',
    aiRateLimiter,
    authenticate,
    authorize(UserRole.ADMIN),
    validate(generateQuestionsSchema),
    controller.generate
  );

  return router;
}
