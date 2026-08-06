import { UserRole } from '../../generated/prisma';
import { AuthorizationError, PayloadTooLargeError, ValidationError } from '../../shared/errors';
import { StorageProvider } from '../../shared/storage/storage-provider';
import { detectImageMime } from '../../shared/utils/image-signature';
import { env } from '../../config/env';
import { MIME_TO_EXTENSION, MediaType, TYPE_FOLDER_MAP, TYPE_ROLE_MATRIX, UploadResultDTO } from './media.types';

export interface UploadableFile {
  buffer: Buffer;
  size: number;
}

/**
 * NO recibe PrismaClient — no toca BD. Es la única desviación del patrón
 * canónico de servicio y es intencional: subir un archivo no crea ni
 * actualiza ningún recurso, solo devuelve una URL (ver docs/api-reference.md §6).
 */
export class MediaService {
  constructor(private readonly storage: StorageProvider) {}

  async upload(
    file: UploadableFile | undefined,
    type: MediaType,
    role: UserRole,
  ): Promise<UploadResultDTO> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new ValidationError('Debes adjuntar un archivo en el campo "file"');
    }

    if (file.size > env.MAX_UPLOAD_SIZE_BYTES) {
      throw new PayloadTooLargeError('El archivo supera el tamaño máximo de 5 MB');
    }

    const mimeType = detectImageMime(file.buffer);
    if (!mimeType) {
      throw new ValidationError('Tipo de archivo no soportado. Formatos permitidos: jpg, png, webp');
    }

    if (!TYPE_ROLE_MATRIX[type].includes(role)) {
      throw new AuthorizationError(`Tu rol no puede subir archivos de tipo "${type}"`);
    }

    const folder = TYPE_FOLDER_MAP[type];
    const extension = MIME_TO_EXTENSION[mimeType];

    return this.storage.save({ buffer: file.buffer, mimeType, extension }, folder);
  }
}
