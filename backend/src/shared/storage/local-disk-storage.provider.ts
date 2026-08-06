import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { StorableFile, StorageProvider, StorageSaveResult, UploadFolder } from './storage-provider';

/**
 * Implementación de `StorageProvider` que escribe en el filesystem local.
 * Es la única clase de todo el backend que conoce el filesystem — Gcs (Fase
 * 2) implementará la misma interfaz sin que controller/service se enteren.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl: string,
    private readonly publicPath: string,
  ) {}

  async save(file: StorableFile, folder: UploadFolder): Promise<StorageSaveResult> {
    const folderDir = path.join(this.rootDir, folder);
    await mkdir(folderDir, { recursive: true });

    const filename = `${randomUUID()}.${file.extension}`;
    const destination = path.join(folderDir, filename);

    // Flag 'wx': falla si el archivo ya existe — nunca sobrescribe.
    await writeFile(destination, file.buffer, { flag: 'wx' });

    return { url: this.buildPublicUrl(folder, filename) };
  }

  private buildPublicUrl(folder: UploadFolder, filename: string): string {
    const base = this.publicBaseUrl.replace(/\/+$/, '');
    const publicPath = this.publicPath.replace(/^\/+|\/+$/g, '');
    return `${base}/${publicPath}/${folder}/${filename}`;
  }
}
