import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginRateLimiter, registerRateLimiter } from '../../middleware/rate-limiter.middleware';
import { loginSchema, refreshSchema, registerSchema } from './auth.validator';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/register', registerRateLimiter, validate(registerSchema), controller.register);

  router.post('/login', loginRateLimiter, validate(loginSchema), controller.login);

  router.post('/refresh', validate(refreshSchema), controller.refresh);

  router.post('/logout', authenticate, controller.logout);

  return router;
}
