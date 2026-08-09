import { type Mock } from 'vitest';

/**
 * Tipo helper para un modelo de Prisma mockeado.
 * Cada operación es un vi.fn() que se puede configurar con mockResolvedValue.
 * Usar en vez de `any` para mantener type-safety en los tests.
 *
 * Uso:
 *   const prismaMock: PrismaMockClient = { user: mockModel(), reading: mockModel() };
 */
export type MockModel = Record<string, Mock>;

export interface PrismaMockClient {
  [model: string]: MockModel;
}
