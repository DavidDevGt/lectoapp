import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  buildAdminQuestion,
  buildAuthUser,
  buildReadingDetail,
  buildReadingListItem,
} from './fixtures';

/**
 * Lado consumidor del contrato de API (ver contracts/api.contract.json).
 *
 * Los fixtures están tipados con los tipos de `types/api.ts`, así que si alguien
 * agrega o quita un campo allí, el fixture cambia de forma y este test falla.
 * El test gemelo del backend valida la otra mitad contra el mismo archivo.
 */

interface ApiContract {
  version: number;
  entities: Record<string, string[]>;
}

// El entorno de test es jsdom, donde import.meta.url no es una URL de archivo.
// Vitest siempre corre desde la raíz del paquete admin/, así que partimos de ahí.
const contractPath = resolve(process.cwd(), '../contracts/api.contract.json');
const contract = JSON.parse(readFileSync(contractPath, 'utf-8')) as ApiContract;

function keysOf(value: object): string[] {
  return Object.keys(value).sort();
}

function expectedKeys(entity: string): string[] {
  const keys = contract.entities[entity];
  if (!keys) throw new Error(`El contrato no define la entidad "${entity}"`);
  return [...keys].sort();
}

describe('contrato de API — lado admin', () => {
  it('AuthUser coincide con el contrato', () => {
    expect(keysOf(buildAuthUser())).toEqual(expectedKeys('AuthUser'));
  });

  it('ReadingListItem coincide con el contrato', () => {
    expect(keysOf(buildReadingListItem())).toEqual(expectedKeys('ReadingListItem'));
  });

  it('ReadingDetail coincide con el contrato', () => {
    expect(keysOf(buildReadingDetail())).toEqual(expectedKeys('ReadingDetail'));
  });

  it('AdminQuestion coincide con el contrato', () => {
    expect(keysOf(buildAdminQuestion())).toEqual(expectedKeys('AdminQuestion'));
  });
});
