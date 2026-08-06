import { describe, it, expect } from 'vitest';
import { detectImageMime } from '../../src/shared/utils/image-signature';

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

describe('detectImageMime', () => {
  it('should detect image/jpeg when buffer starts with FF D8 FF', () => {
    const buffer = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01);

    expect(detectImageMime(buffer)).toBe('image/jpeg');
  });

  it('should detect image/png when buffer starts with the 8-byte PNG signature', () => {
    const buffer = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d);

    expect(detectImageMime(buffer)).toBe('image/png');
  });

  it('should detect image/webp when buffer has RIFF at offset 0 and WEBP at offset 8', () => {
    const buffer = bytes(
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // file size (arbitrary)
      0x57, 0x45, 0x42, 0x50, // WEBP
    );

    expect(detectImageMime(buffer)).toBe('image/webp');
  });

  it('should return null for a GIF signature', () => {
    const buffer = Buffer.from('GIF89a', 'ascii');

    expect(detectImageMime(buffer)).toBeNull();
  });

  it('should return null for a PDF signature', () => {
    const buffer = Buffer.from('%PDF-1.4', 'ascii');

    expect(detectImageMime(buffer)).toBeNull();
  });

  it('should return null for a ZIP signature (e.g. a renamed SVG/other archive)', () => {
    const buffer = bytes(0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);

    expect(detectImageMime(buffer)).toBeNull();
  });

  it('should return null without throwing for an empty buffer', () => {
    expect(() => detectImageMime(Buffer.alloc(0))).not.toThrow();
    expect(detectImageMime(Buffer.alloc(0))).toBeNull();
  });

  it('should return null without throwing for a buffer shorter than 12 bytes', () => {
    const buffer = bytes(0xff, 0xd8);

    expect(() => detectImageMime(buffer)).not.toThrow();
    expect(detectImageMime(buffer)).toBeNull();
  });

  it('should return null when RIFF is present but WEBP is missing at offset 8', () => {
    const buffer = bytes(
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // "AVI " instead of WEBP
    );

    expect(detectImageMime(buffer)).toBeNull();
  });
});
