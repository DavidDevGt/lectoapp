import { describe, it, expect } from 'vitest';
import { sanitizePlainText } from '../../src/shared/utils/sanitize-html';

describe('sanitizePlainText', () => {
  it('should strip a script tag and its inner text', () => {
    expect(sanitizePlainText('Hola <script>alert(1)</script> mundo')).toBe('Hola  mundo');
  });

  it('should strip formatting tags but keep their inner text', () => {
    expect(sanitizePlainText('<b>Importante:</b> lee con atención')).toBe('Importante: lee con atención');
  });

  it('should strip an onerror attribute payload disguised as an image tag', () => {
    expect(sanitizePlainText('<img src=x onerror="alert(1)">texto')).toBe('texto');
  });

  it('should leave plain text without markup untouched aside from trimming', () => {
    expect(sanitizePlainText('El Popol Vuh es un texto sagrado maya')).toBe(
      'El Popol Vuh es un texto sagrado maya',
    );
  });

  it('should trim surrounding whitespace', () => {
    expect(sanitizePlainText('  espacios  ')).toBe('espacios');
  });
});
