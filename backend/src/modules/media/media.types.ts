import { UserRole } from '../../generated/prisma';
import { AllowedImageExtension, AllowedImageMime, UploadFolder } from '../../shared/storage/storage-provider';

export type MediaType = 'reading-cover' | 'avatar';

export interface UploadResultDTO {
  url: string;
}

/**
 * Matriz rol↔type (decisión final del equipo, distinta de la spec original):
 * ADMIN puede subir reading-cover y avatar (un admin debe poder cambiar su
 * propia foto). STUDENT solo puede subir avatar.
 */
export const TYPE_ROLE_MATRIX: Record<MediaType, UserRole[]> = {
  'reading-cover': [UserRole.ADMIN],
  avatar: [UserRole.ADMIN, UserRole.STUDENT],
};

// Mapeo cerrado — nunca derivado de input libre del cliente.
export const TYPE_FOLDER_MAP: Record<MediaType, UploadFolder> = {
  'reading-cover': 'covers',
  avatar: 'avatars',
};

export const MIME_TO_EXTENSION: Record<AllowedImageMime, AllowedImageExtension> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
