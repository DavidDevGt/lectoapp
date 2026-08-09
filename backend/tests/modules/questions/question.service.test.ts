import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionService } from '../../../src/modules/questions/question.service';
import { NotFoundError, ValidationError } from '../../../src/shared/errors';
import { PrismaMockClient } from '../../helpers/prisma-mock';

describe('QuestionService', () => {
  let service: QuestionService;
  let prismaMock: PrismaMockClient;

  beforeEach(() => {
    prismaMock = {
      reading: { findFirst: vi.fn() },
      question: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new QuestionService(prismaMock);
  });

  describe('approve', () => {
    it('should throw ValidationError when the question is already APPROVED', async () => {
      prismaMock.question.findFirst.mockResolvedValue({ id: 'q1', status: 'APPROVED' });

      await expect(service.approve('reading-1', 'q1')).rejects.toThrow(ValidationError);
      expect(prismaMock.question.update).not.toHaveBeenCalled();
    });

    it('should approve a DRAFT question', async () => {
      prismaMock.question.findFirst.mockResolvedValue({ id: 'q1', status: 'DRAFT' });
      prismaMock.question.update.mockResolvedValue({ id: 'q1', status: 'APPROVED' });

      const result = await service.approve('reading-1', 'q1');

      expect(prismaMock.question.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { status: 'APPROVED' },
      });
      expect(result.status).toBe('APPROVED');
    });

    it('should throw NotFoundError when the question does not belong to the reading', async () => {
      prismaMock.question.findFirst.mockResolvedValue(null);

      await expect(service.approve('reading-1', 'q999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should throw NotFoundError when the reading does not exist', async () => {
      prismaMock.reading.findFirst.mockResolvedValue(null);

      await expect(
        service.create('missing-reading', {
          statement: '¿Pregunta?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
            { id: 'c', text: 'C' },
            { id: 'd', text: 'D' },
          ],
          correctAnswer: 'a',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should create a question with status APPROVED and isAiGenerated false', async () => {
      prismaMock.reading.findFirst.mockResolvedValue({ id: 'reading-1' });
      prismaMock.question.create.mockResolvedValue({ id: 'q1' });

      await service.create('reading-1', {
        statement: '¿Pregunta?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' },
          { id: 'c', text: 'C' },
          { id: 'd', text: 'D' },
        ],
        correctAnswer: 'a',
      });

      expect(prismaMock.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isAiGenerated: false, status: 'APPROVED' }),
      });
    });

    it('should strip HTML tags from statement, explanation and option text', async () => {
      prismaMock.reading.findFirst.mockResolvedValue({ id: 'reading-1' });
      prismaMock.question.create.mockResolvedValue({ id: 'q1' });

      await service.create('reading-1', {
        statement: '<b>¿Qué</b> pasó?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: '<script>alert(1)</script>A' },
          { id: 'b', text: 'B' },
          { id: 'c', text: 'C' },
          { id: 'd', text: 'D' },
        ],
        correctAnswer: 'a',
        explanation: '<i>Porque</i> sí',
      });

      expect(prismaMock.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          statement: '¿Qué pasó?',
          explanation: 'Porque sí',
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
            { id: 'c', text: 'C' },
            { id: 'd', text: 'D' },
          ],
        }),
      });
    });
  });

  describe('update', () => {
    it('should strip HTML tags from statement/explanation/options when present', async () => {
      prismaMock.question.findFirst.mockResolvedValue({ id: 'q1', readingId: 'reading-1' });
      prismaMock.question.update.mockResolvedValue({ id: 'q1' });

      await service.update('reading-1', 'q1', {
        statement: '<b>Nuevo</b> enunciado',
      });

      expect(prismaMock.question.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: expect.objectContaining({ statement: 'Nuevo enunciado' }),
      });
    });

    it('should not touch statement/explanation/options when absent from the payload', async () => {
      prismaMock.question.findFirst.mockResolvedValue({ id: 'q1', readingId: 'reading-1' });
      prismaMock.question.update.mockResolvedValue({ id: 'q1' });

      await service.update('reading-1', 'q1', { order: 3 });

      expect(prismaMock.question.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { order: 3 },
      });
    });
  });
});
