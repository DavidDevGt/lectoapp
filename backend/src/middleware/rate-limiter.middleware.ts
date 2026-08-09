import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../shared/types/api-response';

const tooManyRequestsResponse: ApiResponse<null> = {
  success: false,
  data: null,
  error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
};

export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(tooManyRequestsResponse);
    },
  });
}

// Límites específicos definidos en docs/api-reference.md
export const registerRateLimiter = createRateLimiter(60_000, 5);
export const loginRateLimiter = createRateLimiter(60_000, 10);
export const uploadRateLimiter = createRateLimiter(60_000, 20);
export const aiRateLimiter = createRateLimiter(60_000, 3);
