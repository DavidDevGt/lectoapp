import { AllowedImageMime } from '../storage/storage-provider';

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_SIGNATURE_OFFSET = 8;

function matchesSignatureAt(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) {
    return false;
  }

  return signature.every((byte, index) => buffer[offset + index] === byte);
}

/**
 * Detecta el tipo MIME real de una imagen inspeccionando sus "magic bytes"
 * (firma binaria), no el `Content-Type` declarado ni la extensión del nombre
 * de archivo. Nunca lanza — buffers vacíos o más cortos que la firma
 * esperada simplemente no coinciden y retornan null.
 */
export function detectImageMime(buffer: Buffer): AllowedImageMime | null {
  if (matchesSignatureAt(buffer, JPEG_SIGNATURE)) {
    return 'image/jpeg';
  }

  if (matchesSignatureAt(buffer, PNG_SIGNATURE)) {
    return 'image/png';
  }

  if (
    matchesSignatureAt(buffer, RIFF_SIGNATURE) &&
    matchesSignatureAt(buffer, WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET)
  ) {
    return 'image/webp';
  }

  return null;
}
