import { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { env } from '../config/env';
import { PayloadTooLargeError, ValidationError } from '../shared/errors';

// Único archivo de todo el backend que importa multer.
//
// NOTA: `limits.fileSize` en multer/busboy es un límite EXCLUSIVO — un archivo
// de exactamente ese tamaño ya dispara LIMIT_FILE_SIZE (verificado empíricamente).
// Como la regla de negocio exige que exactamente 5 242 880 bytes sea válido y
// solo 5 242 881 sea 413, se configura el límite de multer en +1 byte para no
// rechazar el caso límite aquí; la verificación exacta y autoritativa vive en
// MediaService.upload() (doble control de tamaño, ver docs/api-reference.md §6).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES + 1, files: 1 },
});

const singleFileUpload = upload.single('file');

function translateMulterError(err: MulterError): ValidationError | PayloadTooLargeError {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new PayloadTooLargeError('El archivo supera el tamaño máximo de 5 MB');
  }

  return new ValidationError('Solo se permite un archivo en el campo "file"');
}

export function uploadSingleImage(req: Request, res: Response, next: NextFunction): void {
  singleFileUpload(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof MulterError) {
      next(translateMulterError(err));
      return;
    }

    next(err);
  });
}
