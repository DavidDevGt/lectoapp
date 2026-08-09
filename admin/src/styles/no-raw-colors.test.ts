import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Impide que vuelvan a aparecer colores sueltos en el código.
 *
 * El panel llegó a tener 148 literales hexadecimales repartidos en los CSS
 * modules y 4 más incrustados en TSX. Migrarlos a tokens no sirve de nada si
 * nada evita que el próximo cambio vuelva a escribir `#2563eb` a mano — sobre
 * todo cuando buena parte del código lo escriben agentes.
 *
 * La única excepción es la propia capa de tokens, donde los literales viven a
 * propósito.
 */

const SRC = resolve(process.cwd(), 'src');
const TOKEN_LAYER = ['src/styles/tokens.ts', 'src/styles/tokens.css'];
const HEX = /#[0-9a-f]{3,8}\b/gi;
const RGB = /\brgba?\s*\(/gi;

function walk(dir: string, matcher: (file: string) => boolean): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full, matcher));
    } else if (matcher(full)) {
      found.push(full);
    }
  }
  return found;
}

function isTokenLayer(file: string): boolean {
  const rel = relative(process.cwd(), file).replace(/\\/g, '/');
  return TOKEN_LAYER.includes(rel);
}

function offendersIn(files: string[]): string[] {
  const offenders: string[] = [];
  for (const file of files) {
    if (isTokenLayer(file)) continue;
    const content = readFileSync(file, 'utf-8');
    const rel = relative(process.cwd(), file).replace(/\\/g, '/');

    content.split('\n').forEach((line, index) => {
      for (const pattern of [HEX, RGB]) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          offenders.push(`${rel}:${index + 1} → ${line.trim()}`);
        }
      }
    });
  }
  return offenders;
}

describe('sistema de color', () => {
  it('no deja colores literales en los CSS modules', () => {
    const files = walk(SRC, (f) => f.endsWith('.module.css') || f.endsWith('.css'));
    expect(offendersIn(files)).toEqual([]);
  });

  it('no deja colores literales en los componentes', () => {
    // Los tests y las stories quedan fuera: documentan el sistema y citan
    // valores concretos en prosa ("#0072CE es el azul canónico"), que es
    // legítimo. Lo que se persigue aquí es el color aplicado en producción.
    const files = walk(
      SRC,
      (f) =>
        (f.endsWith('.tsx') || f.endsWith('.ts')) &&
        !f.includes('.test.') &&
        !f.includes('.stories.'),
    );
    expect(offendersIn(files)).toEqual([]);
  });
});
