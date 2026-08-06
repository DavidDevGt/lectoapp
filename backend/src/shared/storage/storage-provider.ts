export type UploadFolder = 'covers' | 'avatars';

export type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export type AllowedImageExtension = 'jpg' | 'png' | 'webp';

export interface StorableFile {
  buffer: Buffer;
  mimeType: AllowedImageMime;
  extension: AllowedImageExtension;
}

export interface StorageSaveResult {
  url: string;
}

/**
 * Contrato de almacenamiento de archivos. `LocalDiskStorageProvider` es la
 * única implementación hoy; un futuro `GcsStorageProvider` se enchufa aquí
 * sin tocar `MediaController` ni `MediaService`.
 */
export interface StorageProvider {
  save(file: StorableFile, folder: UploadFolder): Promise<StorageSaveResult>;
}
