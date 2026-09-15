import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { sanitizeImage } from '../../src/shared/utils/image-sanitizer';
import { ValidationError } from '../../src/shared/errors';

describe('image-sanitizer (Defensa EXIF / GPS - Ley PINA R-10)', () => {
  it('debe purgar completamente los metadatos EXIF de un JPEG', async () => {
    // Generar imagen JPEG con metadatos EXIF embebidos
    const rawWithMetadata = await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 120, g: 150, b: 200 } },
    })
      .withMetadata({
        exif: {
          IFD0: {
            Artist: 'Estudiante Menor de Edad',
            Make: 'CamaraSmartPhone',
            Model: 'GPS-Tracker-Phone',
            Software: 'SchoolOS',
          },
        },
      })
      .jpeg()
      .toBuffer();

    // Confirmar que el buffer original sí contiene etiquetas EXIF
    const originalMeta = await sharp(rawWithMetadata).metadata();
    expect(originalMeta.exif).toBeDefined();

    // Sanitizar el buffer
    const sanitizedBuffer = await sanitizeImage(rawWithMetadata, 'image/jpeg');

    // Inspeccionar la imagen resultante
    const sanitizedMeta = await sharp(sanitizedBuffer).metadata();
    expect(sanitizedMeta.format).toBe('jpeg');
    expect(sanitizedMeta.width).toBe(16);
    expect(sanitizedMeta.height).toBe(16);
    // Garantizar que la sección EXIF fue purgada
    expect(sanitizedMeta.exif).toBeUndefined();
  });

  it('debe sanitizar correctamente imágenes PNG', async () => {
    const pngBuffer = await sharp({
      create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const sanitized = await sanitizeImage(pngBuffer, 'image/png');
    const meta = await sharp(sanitized).metadata();

    expect(meta.format).toBe('png');
    expect(meta.width).toBe(10);
    expect(meta.height).toBe(10);
    expect(meta.exif).toBeUndefined();
  });

  it('debe sanitizar correctamente imágenes WebP', async () => {
    const webpBuffer = await sharp({
      create: { width: 12, height: 12, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .webp()
      .toBuffer();

    const sanitized = await sanitizeImage(webpBuffer, 'image/webp');
    const meta = await sharp(sanitized).metadata();

    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(12);
    expect(meta.height).toBe(12);
    expect(meta.exif).toBeUndefined();
  });

  it('debe lanzar ValidationError si los bytes de imagen están corruptos o incompletos', async () => {
    // Falso JPEG: cabecera mágica FF D8 FF pero con payload basura
    const fakeTruncatedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]);

    await expect(sanitizeImage(fakeTruncatedJpeg, 'image/jpeg')).rejects.toThrow(ValidationError);
    await expect(sanitizeImage(fakeTruncatedJpeg, 'image/jpeg')).rejects.toThrow(
      'El archivo de imagen está dañado o no es válido',
    );
  });
});
