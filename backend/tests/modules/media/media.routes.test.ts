import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import type { Application } from 'express';

function jpegBuffer(size = 20): Buffer {
  const buffer = Buffer.alloc(Math.max(size, 3));
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
}

function gifBuffer(): Buffer {
  return Buffer.from('GIF89aXXXXXXXXXXXX', 'ascii');
}

function zipBuffer(): Buffer {
  return Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
}

function riffWithoutWebp(): Buffer {
  return Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00,
    0x41, 0x56, 0x49, 0x20, // "AVI " instead of WEBP
  ]);
}

describe('POST /api/media/upload', () => {
  let uploadDir: string;
  let app: Application;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    uploadDir = await mkdtemp(path.join(tmpdir(), 'lectoapp-media-http-'));
    process.env.UPLOAD_DIR = uploadDir;
    process.env.UPLOAD_PUBLIC_PATH = '/uploads';
    process.env.API_URL = 'http://localhost:3000';

    const { createApp } = await import('../../../src/app');
    const { signAccessToken } = await import('../../../src/shared/utils/jwt');
    const { UserRole } = await import('../../../src/generated/prisma');

    app = createApp();
    adminToken = signAccessToken({ sub: 'admin-1', role: UserRole.ADMIN });
    studentToken = signAccessToken({ sub: 'student-1', role: UserRole.STUDENT });
  });

  afterAll(async () => {
    await rm(uploadDir, { recursive: true, force: true });
  });

  it('should return 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when the attached file is 0 bytes', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', Buffer.alloc(0), 'empty.png');

    expect(res.status).toBe(400);
  });

  it('should return 400 with details[0].field === "type" when type is missing', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', jpegBuffer(), 'cover.jpg');

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('type');
  });

  it('should return 400 with details[0].field === "type" when type is invalid', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'banner')
      .attach('file', jpegBuffer(), 'cover.jpg');

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('type');
  });

  it('should return 400 when two files are attached under the field "file"', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', jpegBuffer(), 'a.jpg')
      .attach('file', jpegBuffer(), 'b.jpg');

    expect(res.status).toBe(400);
  });

  it('should return 400 when the file field name is not "file"', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('image', jpegBuffer(), 'cover.jpg');

    expect(res.status).toBe(400);
  });

  it('should return 201 when the file is exactly 5242880 bytes (the max allowed size)', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', jpegBuffer(5242880), 'cover.jpg');

    expect(res.status).toBe(201);
    expect(res.body.data.url).toBeTruthy();
  }, 15000);

  it('should return 413 when the file is 5242881 bytes (one byte over the max)', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', jpegBuffer(5242881), 'cover.jpg');

    expect(res.status).toBe(413);
  }, 15000);

  it('should return 400 for a GIF renamed to .png (content-based validation, not extension)', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', gifBuffer(), 'cover.png');

    expect(res.status).toBe(400);
  });

  it('should return 400 for a ZIP renamed to .png', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', zipBuffer(), 'cover.png');

    expect(res.status).toBe(400);
  });

  it('should return 400 without an index-out-of-range exception for a buffer shorter than 12 bytes', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', Buffer.from([0xff, 0xd8]), 'tiny.jpg');

    expect(res.status).toBe(400);
  });

  it('should return 400 for RIFF without WEBP at offset 8', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', riffWithoutWebp(), 'video.webp');

    expect(res.status).toBe(400);
  });

  it('should ignore a malicious originalname (path traversal) and generate a server-side UUID name', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'avatar')
      .attach('file', jpegBuffer(), '../../../../etc/passwd');

    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(
      /\/uploads\/avatars\/[0-9a-f-]{36}\.jpg$/i,
    );
    expect(res.body.data.url).not.toContain('passwd');

    // Nada se escribió fuera del uploadDir del test.
    const avatarFiles = await readdir(path.join(uploadDir, 'avatars'));
    expect(avatarFiles.every((f) => /^[0-9a-f-]{36}\.jpg$/i.test(f))).toBe(true);
  });

  it('should return two different URLs for two uploads of the exact same binary', async () => {
    const content = jpegBuffer();

    const first = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', content, 'same.jpg');

    const second = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', content, 'same.jpg');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data.url).not.toBe(second.body.data.url);
  });

  it('should return 403 when a STUDENT uploads a reading-cover', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('type', 'reading-cover')
      .attach('file', jpegBuffer(), 'cover.jpg');

    expect(res.status).toBe(403);
  });

  it('should return 401 when the Authorization header is missing', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .field('type', 'avatar')
      .attach('file', jpegBuffer(), 'avatar.jpg');

    expect(res.status).toBe(401);
  });

  it('should return a valid absolute URL and serve it back with a Cross-Origin-Resource-Policy: cross-origin header', async () => {
    const uploadRes = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('type', 'reading-cover')
      .attach('file', jpegBuffer(), 'cover.jpg');

    expect(uploadRes.status).toBe(201);
    expect(() => z.string().url().parse(uploadRes.body.data.url)).not.toThrow();

    const publicUrl = new URL(uploadRes.body.data.url);
    const getRes = await request(app).get(publicUrl.pathname);

    expect(getRes.status).toBe(200);
    expect(getRes.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('should never expose files outside the upload root via path traversal in the URL', async () => {
    const plain = await request(app).get('/uploads/../.env');
    expect(plain.status).not.toBe(200);

    const encoded = await request(app).get('/uploads/%2e%2e/.env');
    expect(encoded.status).not.toBe(200);
  });
});
