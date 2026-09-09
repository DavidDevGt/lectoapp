import 'dotenv/config';
import { z } from 'zod';

/** Longitud mínima de un secreto JWT. 32 bytes es el tamaño de salida de HS256:
 * un secreto más corto reduce la seguridad efectiva de la firma por debajo del
 * propio algoritmo y es forzable offline a partir de un solo token capturado. */
const MIN_JWT_SECRET_LENGTH = 32;

/** Un secreto con muy pocos caracteres distintos ("aaaa…", "0000…") pasa el
 * mínimo de longitud pero no aporta entropía. Es siempre un placeholder. */
const MIN_JWT_SECRET_DISTINCT_CHARS = 5;

const jwtSecret = (name: string) =>
  z
    .string()
    .min(MIN_JWT_SECRET_LENGTH, `${name} debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres`)
    .refine(
      (value) => new Set(value).size >= MIN_JWT_SECRET_DISTINCT_CHARS,
      `${name} no tiene entropía suficiente — parece un valor de relleno. Genéralo con \`openssl rand -base64 48\``,
    );

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    API_URL: z.string().url().default('http://localhost:3000'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),

    JWT_ACCESS_SECRET: jwtSecret('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: jwtSecret('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().positive().default(12),

    ADMIN_CORS_ORIGIN: z.string().default('http://localhost:5173'),

    /**
     * Número de proxies de confianza ENTRE el cliente y Express, contados desde
     * Express hacia afuera. Se pasa tal cual a `app.set('trust proxy', n)`.
     *
     * Debe ser un número exacto y nunca `true`: con `true` Express cree la
     * X-Forwarded-For entera, y como esa cabecera la puede escribir cualquiera,
     * un atacante falsifica su IP y se salta el rate limiting por completo. Con
     * un número, Express descarta los n saltos de la derecha (los que controlas)
     * y toma el siguiente, que es el que escribió tu propio proxy de borde.
     *
     * 0 = sin proxy (desarrollo, se usa la IP del socket).
     * 2 = la topología de compose.yml: Caddy (TLS) -> nginx (SPA) -> backend.
     */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),

    /**
     * Marca `Secure` de la cookie de refresh. Por defecto sigue a NODE_ENV:
     * activa en producción (exige HTTPS), inactiva en desarrollo para permitir
     * http://localhost. Solo se desactiva a mano para depurar detrás de un proxy.
     */
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === undefined ? undefined : value === 'true'),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),

    UPLOAD_DIR: z.string().min(1).default('./uploads'),
    UPLOAD_PUBLIC_PATH: z.string().startsWith('/').default('/uploads'),
    MAX_UPLOAD_SIZE_BYTES: z.coerce.number().int().positive().default(5242880),

    OLLAMA_HOST: z.string().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('llama3.2'),
  })
  .superRefine((config, ctx) => {
    // Reutilizar el mismo valor permite presentar un refresh token como access
    // token: ambos verifican contra el mismo secreto y `verifyAccessToken` solo
    // mira la firma, no el propósito del token.
    if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message:
          'JWT_REFRESH_SECRET debe ser distinto de JWT_ACCESS_SECRET — reutilizarlo permite usar un refresh token como access token',
      });
    }

    // En producción, servir sin TLS expone contraseñas y tokens en claro. La
    // cookie de refresh sin `Secure` viajaría por HTTP plano.
    if (config.NODE_ENV === 'production' && config.COOKIE_SECURE === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SECURE no puede ser false en producción — la cookie de refresh viajaría en claro',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Se listan los campos, nunca sus valores: este mensaje acaba en los logs.
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida — revisa tu archivo .env');
}

const config = parsed.data;

export const env = {
  ...config,
  COOKIE_SECURE: config.COOKIE_SECURE ?? config.NODE_ENV === 'production',
};
