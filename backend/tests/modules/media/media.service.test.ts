import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaService } from '../../../src/modules/media/media.service';
import { ValidationError, PayloadTooLargeError, AuthorizationError } from '../../../src/shared/errors';
import { StorageProvider } from '../../../src/shared/storage/storage-provider';
import { UserRole } from '../../../src/generated/prisma';

const MAX_UPLOAD_SIZE_BYTES = 5242880; // default de env.ts — no se sobreescribe en tests/setup.ts

function jpegBuffer(size = 20): Buffer {
  const buffer = Buffer.allocUnsafe(Math.max(size, 3));
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
}

function pngBuffer(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
}

function gifBuffer(): Buffer {
  return Buffer.from('GIF89aXXXXXXXX', 'ascii');
}

describe('MediaService', () => {
  let storage: StorageProvider & { save: ReturnType<typeof vi.fn> };
  let service: MediaService;

  beforeEach(() => {
    storage = { save: vi.fn().mockResolvedValue({ url: 'http://localhost:3000/uploads/covers/x.jpg' }) };
    service = new MediaService(storage);
  });

  it('should throw ValidationError when no file is provided', async () => {
    await expect(
      service.upload(undefined, 'reading-cover', UserRole.ADMIN),
    ).rejects.toThrow(ValidationError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when the file buffer is empty', async () => {
    const file = { buffer: Buffer.alloc(0), size: 0 };

    await expect(service.upload(file, 'reading-cover', UserRole.ADMIN)).rejects.toThrow(ValidationError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should throw PayloadTooLargeError when file.size exceeds the max allowed size', async () => {
    const file = { buffer: jpegBuffer(), size: MAX_UPLOAD_SIZE_BYTES + 1 };

    await expect(service.upload(file, 'reading-cover', UserRole.ADMIN)).rejects.toThrow(PayloadTooLargeError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should accept a file whose size is exactly the max allowed size', async () => {
    const file = { buffer: jpegBuffer(20), size: MAX_UPLOAD_SIZE_BYTES };

    await expect(service.upload(file, 'reading-cover', UserRole.ADMIN)).resolves.toBeDefined();
    expect(storage.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ValidationError when the buffer content does not match any allowed image signature', async () => {
    const file = { buffer: gifBuffer(), size: 14 };

    await expect(service.upload(file, 'reading-cover', UserRole.ADMIN)).rejects.toThrow(ValidationError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should throw AuthorizationError when a STUDENT uploads a reading-cover', async () => {
    const file = { buffer: jpegBuffer(), size: 20 };

    await expect(service.upload(file, 'reading-cover', UserRole.STUDENT)).rejects.toThrow(AuthorizationError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should include the type in the AuthorizationError message', async () => {
    const file = { buffer: jpegBuffer(), size: 20 };

    await expect(service.upload(file, 'reading-cover', UserRole.STUDENT)).rejects.toThrow(
      'Tu rol no puede subir archivos de tipo "reading-cover"',
    );
  });

  it('should allow an ADMIN to upload an avatar (admins can change their own photo)', async () => {
    const file = { buffer: jpegBuffer(), size: 20 };

    await expect(service.upload(file, 'avatar', UserRole.ADMIN)).resolves.toBeDefined();
    expect(storage.save).toHaveBeenCalledTimes(1);
  });

  it('should allow a STUDENT to upload an avatar', async () => {
    const file = { buffer: jpegBuffer(), size: 20 };

    await expect(service.upload(file, 'avatar', UserRole.STUDENT)).resolves.toBeDefined();
    expect(storage.save).toHaveBeenCalledTimes(1);
  });

  it('should map type reading-cover to folder covers', async () => {
    const file = { buffer: jpegBuffer(), size: 20 };

    await service.upload(file, 'reading-cover', UserRole.ADMIN);

    expect(storage.save).toHaveBeenCalledWith(expect.anything(), 'covers');
  });

  it('should map type avatar to folder avatars', async () => {
    const file = { buffer: jpegBuffer(), size: 20 };

    await service.upload(file, 'avatar', UserRole.STUDENT);

    expect(storage.save).toHaveBeenCalledWith(expect.anything(), 'avatars');
  });

  it('should derive the extension from the detected magic bytes, not from any client-declared value', async () => {
    const file = { buffer: pngBuffer(), size: 12 };

    await service.upload(file, 'reading-cover', UserRole.ADMIN);

    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'image/png', extension: 'png' }),
      'covers',
    );
  });

  it('should return the url produced by the storage provider', async () => {
    storage.save.mockResolvedValue({ url: 'http://localhost:3000/uploads/avatars/abc.jpg' });
    const file = { buffer: jpegBuffer(), size: 20 };

    const result = await service.upload(file, 'avatar', UserRole.STUDENT);

    expect(result).toEqual({ url: 'http://localhost:3000/uploads/avatars/abc.jpg' });
  });
});
