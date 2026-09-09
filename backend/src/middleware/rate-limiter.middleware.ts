import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/env';
import { ApiResponse } from '../shared/types/api-response';

const tooManyRequestsResponse: ApiResponse<null> = {
  success: false,
  data: null,
  error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
};

export function createRateLimiter(
  windowMs: number,
  max: number,
  options: { skip?: (req: Request) => boolean } = {},
) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(options.skip ? { skip: options.skip } : {}),
    handler: (_req, res) => {
      res.status(429).json(tooManyRequestsResponse);
    },
  });
}

/**
 * Techo general de toda la API.
 *
 * Antes solo estaban limitadas cuatro rutas, así que `GET /api/readings`,
 * `GET /api/users` y sobre todo `POST /api/progress/submit` —la ruta más cara
 * del sistema, varias escrituras y una decena de agregaciones por llamada— se
 * podían invocar sin freno. Este limitador es el suelo común; los específicos
 * de abajo siguen aplicándose ENCIMA de él y son más estrictos.
 *
 * Toma sus valores de RATE_LIMIT_WINDOW_MS y RATE_LIMIT_MAX_REQUESTS, que
 * estaban declaradas y validadas en env.ts pero no las leía nadie.
 *
 * Depende por completo de `trust proxy`: sin la IP real del cliente,
 * express-rate-limit cuenta a todos los usuarios en el mismo cubo y este
 * limitador se convierte en una vía de denegación de servicio en vez de una
 * defensa. Ver la nota en app.ts.
 */
export const generalApiRateLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX_REQUESTS,
  {
    // El health check lo consulta Docker cada pocos segundos y no debe gastar
    // la cuota de nadie, ni quedarse sin respuesta cuando alguien la agota.
    skip: (req) => req.path === '/health',
  },
);

// Límites específicos definidos en docs/api-reference.md. Son más estrictos que
// el general y se aplican además de él, no en su lugar.
export const registerRateLimiter = createRateLimiter(60_000, 5);
export const loginRateLimiter = createRateLimiter(60_000, 10);
export const uploadRateLimiter = createRateLimiter(60_000, 20);
export const aiRateLimiter = createRateLimiter(60_000, 3);
