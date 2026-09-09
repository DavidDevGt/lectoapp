import path from 'node:path';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalApiRateLimiter } from './middleware/rate-limiter.middleware';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { ReadingService } from './modules/readings/reading.service';
import { ReadingController } from './modules/readings/reading.controller';
import { createReadingRoutes } from './modules/readings/reading.routes';
import { QuestionService } from './modules/questions/question.service';
import { QuestionController } from './modules/questions/question.controller';
import { createQuestionRoutes } from './modules/questions/question.routes';
import { UserService } from './modules/users/user.service';
import { UserController } from './modules/users/user.controller';
import { createUserRoutes } from './modules/users/user.routes';
import { ProgressService } from './modules/progress/progress.service';
import { ProgressController } from './modules/progress/progress.controller';
import { createProgressRoutes } from './modules/progress/progress.routes';
import { MediaService } from './modules/media/media.service';
import { MediaController } from './modules/media/media.controller';
import { createMediaRoutes } from './modules/media/media.routes';
import { LocalDiskStorageProvider } from './shared/storage/local-disk-storage.provider';
import { StatsService } from './modules/stats/stats.service';
import { StatsController } from './modules/stats/stats.controller';
import { createStatsRoutes } from './modules/stats/stats.routes';
import { AiService } from './modules/ai/ai.service';
import { AiController } from './modules/ai/ai.controller';
import { createAiRoutes } from './modules/ai/ai.routes';

export function createApp(): Application {
  const app = express();

  /**
   * Número exacto de proxies entre el cliente y este proceso. NUNCA `true`.
   *
   * Con `true`, Express se cree la X-Forwarded-For entera; como esa cabecera la
   * escribe quien envía la petición, cualquiera puede anteponer una IP inventada
   * y saltarse el rate limiting a voluntad. Con un número, Express descarta los
   * n saltos de la derecha —los que tú controlas— y toma el siguiente, que es el
   * que escribió tu proxy de borde.
   *
   * Sin esto, `req.ip` era la IP del contenedor de nginx para TODO el tráfico y
   * express-rate-limit contaba a todos los usuarios en el mismo cubo: diez
   * peticiones dejaban a la plataforma entera sin poder iniciar sesión.
   *
   * El valor debe coincidir con la topología real de despliegue
   * (compose.yml: Caddy -> nginx -> backend = 2). Ver src/config/env.ts.
   */
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  app.use(helmet());
  app.use(cors({ origin: env.ADMIN_CORS_ORIGIN, credentials: true }));
  app.use(compression());

  // Servido de archivos estáticos ANTES de las rutas /api. crossOriginResourcePolicy
  // 'cross-origin' es necesario porque helmet() por defecto bloquea que el admin
  // (:5173) cargue estas imágenes al servirlas desde otro origen (:3000).
  app.use(
    env.UPLOAD_PUBLIC_PATH,
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(path.resolve(env.UPLOAD_DIR), { index: false, dotfiles: 'ignore', fallthrough: true }),
  );

  app.use(express.json());
  // La cookie de refresh es HttpOnly, así que el servidor es el único que puede
  // leerla. Sin este parser, req.cookies no existe y auth cae al modo body.
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  const authController = new AuthController(new AuthService(prisma));
  const readingController = new ReadingController(new ReadingService(prisma));
  const questionController = new QuestionController(new QuestionService(prisma));
  const userController = new UserController(new UserService(prisma));
  const progressController = new ProgressController(new ProgressService(prisma));
  const mediaController = new MediaController(
    new MediaService(
      new LocalDiskStorageProvider(path.resolve(env.UPLOAD_DIR), env.API_URL, env.UPLOAD_PUBLIC_PATH),
    ),
  );
  const statsController = new StatsController(new StatsService(prisma));
  const aiController = new AiController(new AiService(prisma));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, error: null });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, error: null });
  });

  // Techo general de la API. Se monta antes que las rutas para que cubra
  // también las que no tienen limitador propio (readings, users, progress,
  // stats, refresh). Los limitadores específicos, más estrictos, van dentro de
  // cada router y se aplican encima de este.
  app.use('/api', generalApiRateLimiter);

  app.use('/api/auth', createAuthRoutes(authController));
  app.use('/api/readings/:readingId/questions', createQuestionRoutes(questionController));
  app.use('/api/readings', createReadingRoutes(readingController));
  app.use('/api/users', createUserRoutes(userController));
  app.use('/api/progress', createProgressRoutes(progressController));
  app.use('/api/media', createMediaRoutes(mediaController));
  app.use('/api/stats', createStatsRoutes(statsController));
  app.use('/api/ai', createAiRoutes(aiController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
