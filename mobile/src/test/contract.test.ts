import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildAuthUser,
  buildOverallProgress,
  buildReadingDetail,
  buildReadingListItem,
  buildStudentQuestion,
  buildSubmitProgressResult,
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

describe('contrato de API — app móvil', () => {
  it('AuthUser coincide con el contrato', () => {
    expect(keysOf(buildAuthUser())).toEqual(expectedKeys('AuthUser'));
  });

  it('ReadingListItem coincide con el contrato', () => {
    expect(keysOf(buildReadingListItem())).toEqual(expectedKeys('ReadingListItem'));
  });

  it('ReadingDetail coincide con el contrato', () => {
    expect(keysOf(buildReadingDetail())).toEqual(expectedKeys('ReadingDetail'));
  });

  it('StudentQuestion coincide con el contrato', () => {
    expect(keysOf(buildStudentQuestion())).toEqual(expectedKeys('StudentQuestion'));
  });

  it('SubmitProgressResult coincide con el contrato', () => {
    const result = buildSubmitProgressResult();
    expect(keysOf(result)).toEqual(expectedKeys('SubmitProgressResult'));
    expect(keysOf(result.attempt)).toEqual(expectedKeys('SubmitProgressAttempt'));
    expect(keysOf(result.progress)).toEqual(expectedKeys('SubmitProgressState'));
    expect(keysOf(result.rewards)).toEqual(expectedKeys('SubmitProgressRewards'));
  });

  it('OverallProgress coincide con el contrato', () => {
    const progress = buildOverallProgress();
    expect(keysOf(progress)).toEqual(expectedKeys('OverallProgress'));
    expect(keysOf(progress.overall)).toEqual(expectedKeys('OverallProgressSummary'));
    expect(keysOf(progress.byComprehensionLevel.LITERAL)).toEqual(expectedKeys('LevelBreakdown'));
  });

  it('las opciones de pregunta son objetos {id, text}, no cadenas sueltas', () => {
    // El backend siempre serializa objetos; la app ya no ramifica por tipo.
    const [option] = buildStudentQuestion().options;
    expect(keysOf(option)).toEqual(['id', 'text']);
  });
});
