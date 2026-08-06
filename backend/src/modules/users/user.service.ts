import { Prisma, PrismaClient } from '../../generated/prisma';
import { NotFoundError } from '../../shared/errors';
import { PaginatedResult } from '../../shared/types/pagination';
import { UpdateMeInput, UserQuery } from './user.validator';
import { UserProfileDTO } from './user.types';

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<UserProfileDTO> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${id} no encontrado`);
    }
    return this.toProfileDTO(user);
  }

  async updateMe(id: string, input: UpdateMeInput): Promise<UserProfileDTO> {
    await this.findById(id);
    const user = await this.prisma.user.update({ where: { id }, data: input });
    return this.toProfileDTO(user);
  }

  async findAll(query: UserQuery): Promise<PaginatedResult<UserProfileDTO>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: query.role,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => this.toProfileDTO(user)),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  private toProfileDTO(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    gradeLevel: string | null;
    currentLevel: string;
    totalPoints: number;
    streak: number;
    createdAt: Date;
  }): UserProfileDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      gradeLevel: user.gradeLevel,
      currentLevel: user.currentLevel,
      totalPoints: user.totalPoints,
      streak: user.streak,
      createdAt: user.createdAt,
    };
  }
}
