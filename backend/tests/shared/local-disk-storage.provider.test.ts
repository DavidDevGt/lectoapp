import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LocalDiskStorageProvider } from '../../src/shared/storage/local-disk-storage.provider';

const uuidState = vi.hoisted(() => ({ override: null as (() => string) | null }));

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {
    ...actual,
    randomUUID: (
      ...args: Parameters<typeof actual.randomUUID>
    ): ReturnType<typeof actual.randomUUID> =>
      uuidState.override
        ? (uuidState.override() as ReturnType<typeof actual.randomUUID>)
        : actual.randomUUID(...args),
  };
});

describe('LocalDiskStorageProvider', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), 'lectoapp-storage-'));
    uuidState.override = null;
  });

  afterEach(async () => {
    uuidState.override = null;
    await rm(rootDir, { recursive: true, force: true });
  });

  it('should create the destination folder recursively when it does not exist yet', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000', '/uploads');

    await provider.save({ buffer: Buffer.from('fake-image'), mimeType: 'image/png', extension: 'png' }, 'covers');

    const files = await readdir(path.join(rootDir, 'covers'));
    expect(files).toHaveLength(1);
  });

  it('should create the whole directory chain when UPLOAD_DIR itself does not exist yet', async () => {
    const nonExistentRoot = path.join(rootDir, 'does', 'not', 'exist', 'uploads');
    const provider = new LocalDiskStorageProvider(nonExistentRoot, 'http://localhost:3000', '/uploads');

    await provider.save({ buffer: Buffer.from('fake-image'), mimeType: 'image/png', extension: 'png' }, 'avatars');

    const files = await readdir(path.join(nonExistentRoot, 'avatars'));
    expect(files).toHaveLength(1);
  });

  it('should generate a server-side UUID filename with the correct extension, ignoring any client-provided name', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000', '/uploads');

    const result = await provider.save(
      { buffer: Buffer.from('fake-image'), mimeType: 'image/webp', extension: 'webp' },
      'avatars',
    );

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;
    const filename = result.url.split('/').pop() as string;
    expect(filename).toMatch(uuidPattern);
  });

  it('should build an absolute URL as base + publicPath + folder + filename', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000', '/uploads');

    const result = await provider.save(
      { buffer: Buffer.from('fake-image'), mimeType: 'image/png', extension: 'png' },
      'covers',
    );

    expect(result.url).toMatch(/^http:\/\/localhost:3000\/uploads\/covers\/[^/]+\.png$/);
  });

  it('should not produce a double slash when the base URL has a trailing slash', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000/', '/uploads');

    const result = await provider.save(
      { buffer: Buffer.from('fake-image'), mimeType: 'image/png', extension: 'png' },
      'covers',
    );

    expect(result.url).not.toContain('//uploads');
    expect(result.url.startsWith('http://localhost:3000/uploads/')).toBe(true);
  });

  it('should return two different URLs when saving the same binary content twice', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000', '/uploads');
    const file = { buffer: Buffer.from('same-bytes'), mimeType: 'image/png' as const, extension: 'png' as const };

    const first = await provider.save(file, 'covers');
    const second = await provider.save(file, 'covers');

    expect(first.url).not.toBe(second.url);
  });

  it('should write the file inside rootDir and never outside it', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000', '/uploads');

    const result = await provider.save(
      { buffer: Buffer.from('fake-image'), mimeType: 'image/png', extension: 'png' },
      'covers',
    );

    const filename = result.url.split('/').pop() as string;
    await expect(access(path.join(rootDir, 'covers', filename))).resolves.toBeUndefined();
  });

  it('should throw and never overwrite when the generated filename already exists (wx flag)', async () => {
    const provider = new LocalDiskStorageProvider(rootDir, 'http://localhost:3000', '/uploads');
    uuidState.override = () => '11111111-1111-1111-1111-111111111111';

    await provider.save({ buffer: Buffer.from('first'), mimeType: 'image/png', extension: 'png' }, 'covers');

    await expect(
      provider.save({ buffer: Buffer.from('second'), mimeType: 'image/png', extension: 'png' }, 'covers'),
    ).rejects.toThrow();
  });
});
