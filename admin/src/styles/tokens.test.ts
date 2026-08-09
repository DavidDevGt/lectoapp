import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { tokens } from './tokens';

/**
 * Garantiza que tokens.ts y tokens.css sigan siendo el mismo sistema.
 *
 * Sin este test la "fuente única de verdad" es solo una intención: nada impide
 * que alguien cambie un color en el CSS y deje las gráficas de Recharts —que
 * leen los valores desde TypeScript— pintando el color viejo.
 */

const cssPath = resolve(process.cwd(), 'src/styles/tokens.css');
const css = readFileSync(cssPath, 'utf-8');

function parseCssTokens(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const declaration = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(source)) !== null) {
    const [, name, value] = match;
    if (name && value) result[name] = value.trim();
  }
  return result;
}

const cssTokens = parseCssTokens(css);

describe('tokens de diseño', () => {
  it('define en CSS exactamente los mismos tokens que en TypeScript', () => {
    expect(Object.keys(cssTokens).sort()).toEqual(Object.keys(tokens).sort());
  });

  it('asigna el mismo valor a cada token en ambos archivos', () => {
    for (const [name, value] of Object.entries(tokens)) {
      expect(cssTokens[name], `El token ${name} difiere entre tokens.ts y tokens.css`).toBe(value);
    }
  });

  it('no deja ningún color en formato distinto a hexadecimal o rgba', () => {
    const colorTokens = Object.entries(tokens).filter(([name]) => name.startsWith('--color-'));
    expect(colorTokens.length).toBeGreaterThan(0);
    for (const [name, value] of colorTokens) {
      expect(value, `El token ${name} no tiene un formato de color reconocible`).toMatch(
        /^(#[0-9A-F]{6}|rgba?\([\d\s.,]+\))$/i,
      );
    }
  });
});
