import { Prisma, PrismaClient, UserRole } from '../../generated/prisma';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { PaginatedResult } from '../../shared/types/pagination';
import { sanitizePlainText } from '../../shared/utils/sanitize-html';
import { CreateReadingInput, ReadingQuery, UpdateReadingInput } from './reading.validator';
import { ReadingDetailDTO, ReadingListItemDTO, ReadingQuestionDTO } from './reading.types';

const MIN_APPROVED_QUESTIONS_TO_PUBLISH = 5;

function sanitizeReadingText(
  input: Partial<Pick<CreateReadingInput, 'title' | 'content'>>,
): Partial<Pick<CreateReadingInput, 'title' | 'content'>> {
  return {
    ...(input.title !== undefined && { title: sanitizePlainText(input.title) }),
    ...(input.content !== undefined && { content: sanitizePlainText(input.content) }),
  };
}

export class ReadingService {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(query: ReadingQuery, role: UserRole): Promise<PaginatedResult<ReadingListItemDTO>> {
    const where: Prisma.ReadingWhereInput = {
      deletedAt: null,
      status: role === UserRole.ADMIN ? query.status : 'PUBLISHED',
      comprehensionLevel: query.comprehensionLevel,
      progressionLevel: query.progressionLevel,
      title: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.reading.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.reading.count({ where }),
    ]);

    return {
      items: items.map((reading) => ({
        id: reading.id,
        title: reading.title,
        comprehensionLevel: reading.comprehensionLevel,
        progressionLevel: reading.progressionLevel,
        status: reading.status,
        coverImageUrl: reading.coverImageUrl,
        estimatedTimeMin: reading.estimatedTimeMin,
        questionsCount: reading._count.questions,
        createdAt: reading.createdAt,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async findById(id: string, role: UserRole): Promise<ReadingDetailDTO> {
    const reading = await this.prisma.reading.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, name: true } },
        questions: {
          where: role === UserRole.ADMIN ? undefined : { status: 'APPROVED' },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!reading || (role !== UserRole.ADMIN && reading.status !== 'PUBLISHED')) {
      throw new NotFoundError(`Lectura con ID ${id} no encontrada`);
    }

    const isAdmin = role === UserRole.ADMIN;

    return {
      id: reading.id,
      title: reading.title,
      content: reading.content,
      comprehensionLevel: reading.comprehensionLevel,
      progressionLevel: reading.progressionLevel,
      status: reading.status,
      coverImageUrl: reading.coverImageUrl,
      estimatedTimeMin: reading.estimatedTimeMin,
      order: reading.order,
      author: reading.author,
      createdAt: reading.createdAt,
      updatedAt: reading.updatedAt,
      questions: reading.questions.map(
        (q): ReadingQuestionDTO => ({
          id: q.id,
          statement: q.statement,
          type: q.type,
          options: q.options as { id: string; text: string }[],
          order: q.order,
          ...(isAdmin
            ? {
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                isAiGenerated: q.isAiGenerated,
                status: q.status,
              }
            : {}),
        }),
      ),
    };
  }

  async create(input: CreateReadingInput, authorId: string) {
    return this.prisma.reading.create({
      data: { ...input, ...sanitizeReadingText(input), authorId, status: 'DRAFT' },
    });
  }

  async update(id: string, input: UpdateReadingInput) {
    await this.assertExists(id);
    return this.prisma.reading.update({ where: { id }, data: { ...input, ...sanitizeReadingText(input) } });
  }

  async publish(id: string) {
    await this.assertExists(id);

    const approvedCount = await this.prisma.question.count({
      where: { readingId: id, status: 'APPROVED' },
    });

    if (approvedCount < MIN_APPROVED_QUESTIONS_TO_PUBLISH) {
      throw new ValidationError('La lectura necesita al menos 5 preguntas aprobadas para publicarse');
    }

    return this.prisma.reading.update({ where: { id }, data: { status: 'PUBLISHED' } });
  }

  async archive(id: string) {
    await this.assertExists(id);
    return this.prisma.reading.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async softDelete(id: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.reading.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async assertExists(id: string): Promise<void> {
    const reading = await this.prisma.reading.findFirst({ where: { id, deletedAt: null } });
    if (!reading) {
      throw new NotFoundError(`Lectura con ID ${id} no encontrada`);
    }
  }
}
