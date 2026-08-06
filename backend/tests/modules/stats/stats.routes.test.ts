import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import { StatsService } from '../../../src/modules/stats/stats.service';
import { StatsController } from '../../../src/modules/stats/stats.controller';
import { createStatsRoutes } from '../../../src/modules/stats/stats.routes';
import { errorHandler, notFoundHandler } from '../../../src/middleware/error.middleware';
import { signAccessToken } from '../../../src/shared/utils/jwt';
import { UserRole } from '../../../src/generated/prisma';

function emptyAggregate() {
  return { _count: { _all: 0 }, _avg: { percentage: null } };
}

function buildApp(): Application {
  const prismaMock = {
    reading: { count: vi.fn().mockResolvedValue(0), groupBy: vi.fn().mockResolvedValue([]), findMany: vi.fn().mockResolvedValue([]) },
    question: { count: vi.fn().mockResolvedValue(0), groupBy: vi.fn().mockResolvedValue([]) },
    user: { count: vi.fn().mockResolvedValue(0), groupBy: vi.fn().mockResolvedValue([]) },
    quizAttempt: { aggregate: vi.fn().mockResolvedValue(emptyAggregate()), count: vi.fn().mockResolvedValue(0) },
    studentProgress: { groupBy: vi.fn().mockResolvedValue([]) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const controller = new StatsController(new StatsService(prismaMock));
  const app = express();
  app.use(express.json());
  app.use('/api/stats', createStatsRoutes(controller));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('GET /api/stats/dashboard', () => {
  let app: Application;
  let adminToken: string;
  let studentToken: string;

  beforeAll(() => {
    app = buildApp();
    adminToken = signAccessToken({ sub: 'admin-1', role: UserRole.ADMIN });
    studentToken = signAccessToken({ sub: 'student-1', role: UserRole.STUDENT });
  });

  it('should return 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/stats/dashboard');

    expect(res.status).toBe(401);
  });

  it('should return 403 when a STUDENT calls the endpoint', async () => {
    const res = await request(app).get('/api/stats/dashboard').set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 200 with no query params and no meta field', async () => {
    const res = await request(app).get('/api/stats/dashboard').set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toBeUndefined();
    expect(res.body.data.students.activeWithinDays).toBe(7);
  });

  it.each([0, -1, 'abc', 21])('should return 400 when topLimit=%s', async (topLimit) => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .query({ topLimit })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it.each([1, 20])('should return 200 when topLimit=%s', async (topLimit) => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .query({ topLimit })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it.each([0, 91])('should return 400 when activeWithinDays=%s', async (activeWithinDays) => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .query({ activeWithinDays })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it.each([1, 90])('should return 200 when activeWithinDays=%s', async (activeWithinDays) => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .query({ activeWithinDays })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
