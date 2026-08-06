import { Router } from 'express';
import { MediaController } from './media.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadSingleImage } from '../../middleware/upload.middleware';
import { uploadRateLimiter } from '../../middleware/rate-limiter.middleware';
import { uploadMediaSchema } from './media.validator';

export function createMediaRoutes(controller: MediaController): Router {
  const router = Router();

  // Orden obligatorio: multer debe correr ANTES de validate() porque en
  // multipart/form-data req.body no existe hasta que multer lo parsea.
  router.post(
    '/upload',
    uploadRateLimiter,
    authenticate,
    uploadSingleImage,
    validate(uploadMediaSchema),
    controller.upload,
  );

  return router;
}
