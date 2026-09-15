import sharp from 'sharp';
import { AllowedImageMime } from '../storage/storage-provider';
import { ValidationError } from '../errors';

/**
 * Sanitiza un buffer de imagen decodificándolo y re-codificándolo mediante sharp.
 *
 * Este procesamiento implementa las siguientes defensas (OWASP / Ley PINA R-10):
 * 1. Purgado total de metadatos: al no invocar `.withMetadata()`, sharp descarta
 *    por defecto todas las etiquetas EXIF, GPS (latitud/longitud), XMP, IPTC y
 *    comentarios embebidos por cámaras o smartphones.
 * 2. Normalización de orientación: `.rotate()` auto-orienta la imagen basándose en
 *    la orientación EXIF previa al descarte, evitando que fotos tomadas en vertical
 *    por estudiantes o docentes queden giradas 90 grados.
 * 3. Validación estructural y anti-polyglot: asegura que el archivo no sea un
 *    archivo dañado, truncado o malicioso que solo imitó la firma de cabecera.
 */
export async function sanitizeImage(
  buffer: Buffer,
  mimeType: AllowedImageMime,
): Promise<Buffer> {
  try {
    let pipeline = sharp(buffer, { failOn: 'truncated' }).rotate();

    switch (mimeType) {
      case 'image/jpeg':
        pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
        break;
      case 'image/png':
        pipeline = pipeline.png({ compressionLevel: 8 });
        break;
      case 'image/webp':
        pipeline = pipeline.webp({ quality: 85 });
        break;
    }

    return await pipeline.toBuffer();
  } catch {
    throw new ValidationError('El archivo de imagen está dañado o no es válido');
  }
}
