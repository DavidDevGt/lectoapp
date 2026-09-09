import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

/**
 * Sesión sobre HTTP: transporte por cookie para el panel, por cuerpo para la
 * app móvil.
 *
 * Prisma se sustituye por un doble en memoria porque estos tests ejercitan el
 * borde HTTP —cabeceras Set-Cookie, códigos de estado, forma del cuerpo—, no la
 * persistencia.
 */

// `vi.hoisted` es obligatorio aquí: vi.mock se iza por encima de las
// declaraciones del módulo, así que una const normal estaría en zona muerta
// temporal cuando se evalúa la fábrica del mock.
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../../src/config/database', () => ({ prisma: prismaMock }));

const { createApp } = await import('../../../src/app');
const { hashRefreshToken } = await import('../../../src/shared/utils/token-hash');
const { signAccessToken, signRefreshToken } = await import('../../../src/shared/utils/jwt');
const { UserRole } = await import('../../../src/generated/prisma');

const COOKIE_HEADER = { 'X-Auth-Transport': 'cookie' } as const;
const REFRESH_COOKIE = 'lectoapp_rt';

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'admin@ejemplo.com',
    password: '$2a$12$abcdefghijklmnopqrstuv',
    name: 'Giovanni',
    role: UserRole.ADMIN,
    avatarUrl: null,
    gradeLevel: null,
    totalPoints: 0,
    currentLevel: 'BEGINNER',
    streak: 0,
    lastActiveAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function setCookie(res: request.Response): string[] {
  const header = res.headers['set-cookie'];
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

function refreshCookie(res: request.Response): string | undefined {
  return setCookie(res).find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`));
}

let app: Application;

beforeEach(async () => {
  vi.clearAllMocks();
  prismaMock.refreshToken.create.mockResolvedValue({});
  prismaMock.refreshToken.update.mockResolvedValue({});
  prismaMock.refreshToken.updateMany.mockResolvedValue({});

  const passwordUtils = await import('../../../src/shared/utils/password');
  vi.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);

  app = createApp();
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    prismaMock.user.update.mockResolvedValue(buildUser());
  });

  describe('transporte cookie (panel admin)', () => {
    it('pone el refresh token en una cookie y NO lo devuelve en el cuerpo', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set(COOKIE_HEADER)
        .send({ email: 'admin@ejemplo.com', password: 'MiPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTypeOf('string');
      // Si el token apareciera aquí, el JavaScript de la SPA podría leerlo y la
      // cookie HttpOnly no serviría de nada.
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(refreshCookie(res)).toBeDefined();
    });

    it('marca la cookie HttpOnly, SameSite=Strict y acotada a /api/auth', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set(COOKIE_HEADER)
        .send({ email: 'admin@ejemplo.com', password: 'MiPassword123!' });

      const cookie = refreshCookie(res) ?? '';

      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
      // Acotar el path evita que la cookie viaje en /api/readings y en el resto
      // de llamadas que no la necesitan.
      expect(cookie).toContain('Path=/api/auth');
    });

    it('guarda solo el hash del token que puso en la cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set(COOKIE_HEADER)
        .send({ email: 'admin@ejemplo.com', password: 'MiPassword123!' });

      const cookie = refreshCookie(res) ?? '';
      const token = decodeURIComponent(cookie.split(';')[0].split('=')[1]);
      const stored = prismaMock.refreshToken.create.mock.calls[0][0].data;

      expect(stored.tokenHash).toBe(hashRefreshToken(token));
    });
  });

  describe('transporte por cuerpo (app móvil)', () => {
    it('devuelve el refresh token en el cuerpo y no pone cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@ejemplo.com', password: 'MiPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.refreshToken).toBeTypeOf('string');
      expect(refreshCookie(res)).toBeUndefined();
    });
  });
});

describe('POST /api/auth/refresh', () => {
  const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });

  function storedToken(overrides: Record<string, unknown> = {}) {
    return {
      id: 'rt-1',
      tokenHash: hashRefreshToken(token),
      userId: 'user-1',
      family: 'family-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    prismaMock.refreshToken.findUnique.mockResolvedValue(storedToken());
  });

  it('acepta el token desde la cookie y devuelve la rotación en otra cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set(COOKIE_HEADER)
      .set('Cookie', [`${REFRESH_COOKIE}=${token}`])
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeUndefined();

    // El servidor sobrescribe la cookie con el token rotado: el cliente no
    // puede quedarse con el viejo ni por descuido, que era justo lo que
    // disparaba falsas alarmas de reutilización.
    const cookie = refreshCookie(res) ?? '';
    const rotated = decodeURIComponent(cookie.split(';')[0].split('=')[1]);
    expect(rotated).not.toBe(token);
    expect(rotated.length).toBeGreaterThan(0);
  });

  it('acepta el token desde el cuerpo y lo devuelve en el cuerpo (móvil)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: token });

    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).not.toBe(token);
    expect(refreshCookie(res)).toBeUndefined();
  });

  it('responde 401 cuando no llega token por ningún canal', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('en modo cookie ignora un refreshToken puesto en el cuerpo', async () => {
    // Un cliente en modo cookie que mande el token en el cuerpo estaría
    // intentando eludir el transporte seguro. Manda la cookie, que aquí no
    // existe, así que la petición debe fallar.
    const res = await request(app)
      .post('/api/auth/refresh')
      .set(COOKIE_HEADER)
      .send({ refreshToken: token });

    expect(res.status).toBe(401);
  });

  it('borra la cookie cuando el refresh token ya no sirve', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set(COOKIE_HEADER)
      .set('Cookie', [`${REFRESH_COOKIE}=${token}`])
      .send({});

    expect(res.status).toBe(401);
    // Sin esto el navegador seguiría reintentando con una cookie muerta en cada
    // carga de la página.
    const cookie = refreshCookie(res) ?? '';
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
  });

  it('revoca la familia entera al reutilizar un token ya rotado', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(storedToken({ isRevoked: true }));

    const res = await request(app)
      .post('/api/auth/refresh')
      .set(COOKIE_HEADER)
      .set('Cookie', [`${REFRESH_COOKIE}=${token}`])
      .send({});

    expect(res.status).toBe(401);
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { family: 'family-1', isRevoked: false },
      data: { isRevoked: true },
    });
  });
});

describe('POST /api/auth/logout', () => {
  it('revoca los refresh tokens y borra la cookie', async () => {
    const accessToken = signAccessToken({ sub: 'user-1', role: UserRole.ADMIN });

    const res = await request(app)
      .post('/api/auth/logout')
      .set(COOKIE_HEADER)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', [`${REFRESH_COOKIE}=algun-token`]);

    expect(res.status).toBe(204);
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRevoked: false },
      data: { isRevoked: true },
    });

    const cookie = refreshCookie(res) ?? '';
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    // El atributo Path debe coincidir con el del Set-Cookie original o el
    // navegador se queda con la cookie vieja.
    expect(cookie).toContain('Path=/api/auth');
  });

  it('exige autenticación — no se puede cerrar la sesión de otro', async () => {
    const res = await request(app).post('/api/auth/logout').set(COOKIE_HEADER);

    expect(res.status).toBe(401);
    expect(prismaMock.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
