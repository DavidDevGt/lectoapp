import { randomUUID } from 'crypto';
import { PrismaClient, User } from '../../generated/prisma';
import { AccountLockedError, AuthenticationError, ConflictError } from '../../shared/errors';
import { comparePassword, hashPassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { LoginInput, RegisterInput } from './auth.validator';
import { AuthResult, AuthTokens, AuthUserDTO } from './auth.types';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('El email ya está registrado');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        gradeLevel: input.gradeLevel,
      },
    });

    const tokens = await this.issueTokens(user);
    return { user: this.toUserDTO(user), ...tokens };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError();
    }

    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      await this.registerFailedAttempt(user);
      throw new AuthenticationError('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastActiveAt: new Date() },
    });

    const tokens = await this.issueTokens(user);
    return { user: this.toUserDTO(user), ...tokens };
  }

  async refresh(refreshTokenValue: string): Promise<AuthTokens> {
    try {
      verifyRefreshToken(refreshTokenValue);
    } catch {
      throw new AuthenticationError('Refresh token inválido o expirado');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token inválido o expirado');
    }

    if (storedToken.isRevoked) {
      // Reutilización de un token ya rotado: posible robo — se revoca toda la familia.
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family, isRevoked: false },
        data: { isRevoked: true },
      });
      throw new AuthenticationError('Refresh token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { id: storedToken.userId } });
    if (!user) {
      throw new AuthenticationError('Refresh token inválido o expirado');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.issueTokens(user, storedToken.family);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  private async registerFailedAttempt(user: User): Promise<void> {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const shouldLock = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : failedLoginAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });
  }

  private async issueTokens(user: User, family: string = randomUUID()): Promise<AuthTokens> {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, family });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        family,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  private toUserDTO(user: User): AuthUserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      currentLevel: user.currentLevel,
      totalPoints: user.totalPoints,
      streak: user.streak,
    };
  }
}
