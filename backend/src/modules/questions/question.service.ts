import { PrismaClient, UserRole } from '../../generated/prisma';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { CreateQuestionInput, QuestionQuery, UpdateQuestionInput } from './question.validator';
import { QuestionDTO } from './question.types';

export class QuestionService {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllByReading(
    readingId: string,
    role: UserRole,
    query: QuestionQuery,
  ): Promise<QuestionDTO[]> {
    await this.assertReadingVisible(readingId, role);

    const isAdmin = role === UserRole.ADMIN;

    const questions = await this.prisma.question.findMany({
      where: {
        readingId,
        status: isAdmin ? query.status : 'APPROVED',
      },
      orderBy: { order: 'asc' },
    });

    return questions.map((q) => ({
      id: q.id,
      statement: q.statement,
      type: q.type,
      options: q.options as { id: string; text: string }[],
      order: q.order,
      isAiGenerated: q.isAiGenerated,
      ...(isAdmin ? { correctAnswer: q.correctAnswer, explanation: q.explanation, status: q.status } : {}),
    }));
  }

  async create(readingId: string, input: CreateQuestionInput) {
    await this.assertReadingExists(readingId);

    return this.prisma.question.create({
      data: {
        readingId,
        statement: input.statement,
        type: input.type,
        options: input.options,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        order: input.order ?? 0,
        isAiGenerated: false,
        status: 'APPROVED',
      },
    });
  }

  async update(readingId: string, id: string, input: UpdateQuestionInput) {
    await this.assertQuestionExists(readingId, id);
    return this.prisma.question.update({ where: { id }, data: input });
  }

  async delete(readingId: string, id: string): Promise<void> {
    await this.assertQuestionExists(readingId, id);
    await this.prisma.question.delete({ where: { id } });
  }

  async approve(readingId: string, id: string) {
    const question = await this.assertQuestionExists(readingId, id);

    if (question.status === 'APPROVED') {
      throw new ValidationError('La pregunta ya está aprobada');
    }

    return this.prisma.question.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  private async assertReadingExists(readingId: string): Promise<void> {
    const reading = await this.prisma.reading.findFirst({
      where: { id: readingId, deletedAt: null },
    });
    if (!reading) {
      throw new NotFoundError(`Lectura con ID ${readingId} no encontrada`);
    }
  }

  private async assertReadingVisible(readingId: string, role: UserRole): Promise<void> {
    const reading = await this.prisma.reading.findFirst({
      where: { id: readingId, deletedAt: null },
    });

    if (!reading || (role !== UserRole.ADMIN && reading.status !== 'PUBLISHED')) {
      throw new NotFoundError(`Lectura con ID ${readingId} no encontrada`);
    }
  }

  private async assertQuestionExists(readingId: string, id: string) {
    const question = await this.prisma.question.findFirst({ where: { id, readingId } });
    if (!question) {
      throw new NotFoundError(`Pregunta con ID ${id} no encontrada`);
    }
    return question;
  }
}
