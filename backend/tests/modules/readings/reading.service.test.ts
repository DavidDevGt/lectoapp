import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReadingService } from '../../../src/modules/readings/reading.service';
import { NotFoundError, ValidationError } from '../../../src/shared/errors';

function buildReading(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'reading-1',
    title: 'El Popol Vuh',
    content: 'Contenido largo de la lectura...',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 8,
    order: 1,
    authorId: 'admin-1',
    author: { id: 'admin-1', name: 'Admin' },
    questions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('ReadingService', () => {
  let service: ReadingService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      reading: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      question: {
        count: vi.fn(),
      },
    };
    service = new ReadingService(prismaMock);
  });

  describe('publish', () => {
    it('should throw ValidationError when fewer than 5 approved questions exist', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading());
      prismaMock.question.count.mockResolvedValue(4);

      await expect(service.publish('reading-1')).rejects.toThrow(ValidationError);
      expect(prismaMock.reading.update).not.toHaveBeenCalled();
    });

    it('should publish when at least 5 approved questions exist', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading({ status: 'DRAFT' }));
      prismaMock.question.count.mockResolvedValue(5);
      prismaMock.reading.update.mockResolvedValue(buildReading({ status: 'PUBLISHED' }));

      const result = await service.publish('reading-1');

      expect(prismaMock.question.count).toHaveBeenCalledWith({
        where: { readingId: 'reading-1', status: 'APPROVED' },
      });
      expect(result.status).toBe('PUBLISHED');
    });

    it('should throw NotFoundError when the reading does not exist', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(null);

      await expect(service.publish('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should strip HTML tags from title and content before persisting', async () => {
      prismaMock.reading.create.mockResolvedValue(buildReading());

      await service.create(
        {
          title: '<b>El Popol Vuh</b>',
          content: 'Contenido <script>alert(1)</script> largo',
          comprehensionLevel: 'LITERAL',
          progressionLevel: 'BEGINNER',
        } as any,
        'admin-1',
      );

      expect(prismaMock.reading.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'El Popol Vuh',
          content: 'Contenido  largo',
        }),
      });
    });
  });

  describe('update', () => {
    it('should strip HTML tags from title/content when present in the payload', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading());
      prismaMock.reading.update.mockResolvedValue(buildReading());

      await service.update('reading-1', { content: '<img src=x onerror=alert(1)>texto' } as any);

      expect(prismaMock.reading.update).toHaveBeenCalledWith({
        where: { id: 'reading-1' },
        data: expect.objectContaining({ content: 'texto' }),
      });
    });

    it('should not touch title/content when they are absent from the payload', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading());
      prismaMock.reading.update.mockResolvedValue(buildReading());

      await service.update('reading-1', { estimatedTimeMin: 10 } as any);

      expect(prismaMock.reading.update).toHaveBeenCalledWith({
        where: { id: 'reading-1' },
        data: { estimatedTimeMin: 10 },
      });
    });
  });

  describe('findById', () => {
    it('should hide a DRAFT reading from a STUDENT', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading({ status: 'DRAFT' }));

      await expect(service.findById('reading-1', 'STUDENT' as any)).rejects.toThrow(NotFoundError);
    });

    it('should strip correctAnswer/explanation for STUDENT role', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(
        buildReading({
          questions: [
            {
              id: 'q1',
              statement: '¿Qué pasó?',
              type: 'MULTIPLE_CHOICE',
              options: [{ id: 'a', text: 'Opción A' }],
              order: 1,
              correctAnswer: 'a',
              explanation: 'Porque sí',
              isAiGenerated: false,
              status: 'APPROVED',
            },
          ],
        }),
      );

      const result = await service.findById('reading-1', 'STUDENT' as any);

      expect(result.questions[0]).not.toHaveProperty('correctAnswer');
      expect(result.questions[0]).not.toHaveProperty('explanation');
    });

    it('should include correctAnswer/explanation for ADMIN role', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(
        buildReading({
          questions: [
            {
              id: 'q1',
              statement: '¿Qué pasó?',
              type: 'MULTIPLE_CHOICE',
              options: [{ id: 'a', text: 'Opción A' }],
              order: 1,
              correctAnswer: 'a',
              explanation: 'Porque sí',
              isAiGenerated: false,
              status: 'APPROVED',
            },
          ],
        }),
      );

      const result = await service.findById('reading-1', 'ADMIN' as any);

      expect(result.questions[0]?.correctAnswer).toBe('a');
    });
  });

  describe('archive', () => {
    it('should update reading status to ARCHIVED', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading({ status: 'PUBLISHED' }));
      prismaMock.reading.update.mockResolvedValue(buildReading({ status: 'ARCHIVED' }));

      const result = await service.archive('reading-1');

      expect(prismaMock.reading.update).toHaveBeenCalledWith({
        where: { id: 'reading-1' },
        data: { status: 'ARCHIVED' },
      });
      expect(result.status).toBe('ARCHIVED');
    });

    it('should throw NotFoundError when reading does not exist', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(null);

      await expect(service.archive('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('unarchive', () => {
    it('should update reading status to DRAFT', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(buildReading({ status: 'ARCHIVED' }));
      prismaMock.reading.update.mockResolvedValue(buildReading({ status: 'DRAFT' }));

      const result = await service.unarchive('reading-1');

      expect(prismaMock.reading.update).toHaveBeenCalledWith({
        where: { id: 'reading-1' },
        data: { status: 'DRAFT' },
      });
      expect(result.status).toBe('DRAFT');
    });

    it('should throw NotFoundError when reading does not exist', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(null);

      await expect(service.unarchive('missing')).rejects.toThrow(NotFoundError);
    });
  });

  // ── Hardener: mutant-killing tests ──────────────────────────────────────────

  describe('publish — minimum question count boundary', () => {
    it('should reject publishing with exactly 4 approved questions (< 5 required)', async () => {
      // A mutation changing `< 5` to `<= 5` would allow publishing with 4 — this test kills it.
      prismaMock.reading.findFirst.mockResolvedValue(buildReading({ status: 'DRAFT' }));
      prismaMock.question.count.mockResolvedValue(4);

      await expect(service.publish('reading-1')).rejects.toThrow(ValidationError);
      expect(prismaMock.reading.update).not.toHaveBeenCalled();
    });

    it('should allow publishing with exactly 5 approved questions (boundary — just enough)', async () => {
      // Confirms the lower bound is inclusive: 5 is the minimum, not 6.
      prismaMock.reading.findFirst.mockResolvedValue(buildReading({ status: 'DRAFT' }));
      prismaMock.question.count.mockResolvedValue(5);
      prismaMock.reading.update.mockResolvedValue(buildReading({ status: 'PUBLISHED' }));

      const result = await service.publish('reading-1');

      expect(result.status).toBe('PUBLISHED');
    });
  });
});

