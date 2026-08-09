import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildAuthUser,
  buildReadingDetail,
  buildReadingListItem,
  buildStudentQuestion,
} from './fixtures';

/**
 * Lado consumidor del contrato de API en la App Móvil (ver contracts/api.contract.json).
 *
 * Los fixtures están tipados con las interfaces de `mobile/src/types/api.ts`.
 * Si el contrato cambia en backend o panel admin, este archivo valida que la app móvil
 * no quede desincronizada.
 */

interface ApiContract {
  version: number;
  entities: Record<string, string[]>;
}

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

export function runContractTests(): void {
  const userKeys = keysOf(buildAuthUser());
  const expectedUserKeys = expectedKeys('AuthUser');
  if (JSON.stringify(userKeys) !== JSON.stringify(expectedUserKeys)) {
    throw new Error(`AuthUser keys mismatch: ${userKeys} vs ${expectedUserKeys}`);
  }

  const listItemKeys = keysOf(buildReadingListItem());
  const expectedListItemKeys = expectedKeys('ReadingListItem');
  if (JSON.stringify(listItemKeys) !== JSON.stringify(expectedListItemKeys)) {
    throw new Error(`ReadingListItem keys mismatch: ${listItemKeys} vs ${expectedListItemKeys}`);
  }

  const detailKeys = keysOf(buildReadingDetail());
  const expectedDetailKeys = expectedKeys('ReadingDetail');
  if (JSON.stringify(detailKeys) !== JSON.stringify(expectedDetailKeys)) {
    throw new Error(`ReadingDetail keys mismatch: ${detailKeys} vs ${expectedDetailKeys}`);
  }

  const questionKeys = keysOf(buildStudentQuestion());
  const expectedQuestionKeys = expectedKeys('StudentQuestion');
  if (JSON.stringify(questionKeys) !== JSON.stringify(expectedQuestionKeys)) {
    throw new Error(`StudentQuestion keys mismatch: ${questionKeys} vs ${expectedQuestionKeys}`);
  }
}
