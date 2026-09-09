import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

/**
 * Rate limiting general e identificación de la IP real.
 *
 * Antes solo cuatro rutas estaban limitadas y, peor, `trust proxy` no estaba
 * configurado: `req.ip` era la IP del contenedor de nginx para TODO el tráfico,
 * así que express-rate-limit metía a todos los usuarios en el mismo cubo. Diez
 * peticiones dejaban a la plataforma entera sin poder iniciar sesión.
 *
 * La topología de compose.yml es Caddy -> nginx -> backend, dos saltos. La
 * cadena que llega a Express es "cliente, caddy" y el socket es nginx.
 */

const CADDY_IP = '172.20.0.5';
const CLIENT_A = '10.0.0.1';
const CLIENT_B = '10.0.0.2';
const MAX_REQUESTS = 3;

// `vi.hoisted`: vi.mock se iza por encima de las declaraciones del módulo.
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('../../src/config/database', () => ({ prisma: prismaMock }));

let app: Application;
let originalEnv: NodeJS.ProcessEnv;

/** Una ruta bajo /api que no toca base de datos: cae en notFoundHandler (404),
 *  pero solo DESPUÉS de pasar por el limitador. */
function hit(clientChain: string) {
  return request(app).get('/api/zona-inexistente').set('X-Forwarded-For', clientChain);
}

beforeAll(async () => {
  originalEnv = { ...process.env };
  process.env.TRUST_PROXY_HOPS = '2';
  process.env.RATE_LIMIT_MAX_REQUESTS = String(MAX_REQUESTS);
  process.env.RATE_LIMIT_WINDOW_MS = '60000';

  vi.resetModules();
  const { createApp } = await import('../../src/app');
  app = createApp();
});

afterAll(() => {
  process.env = originalEnv;
  vi.resetModules();
});

describe('trust proxy', () => {
  it('configura el número exacto de saltos, nunca `true`', () => {
    // Con `true` Express se cree la X-Forwarded-For entera y cualquiera puede
    // anteponer una IP inventada para saltarse el rate limiting.
    expect(app.get('trust proxy')).toBe(2);
    expect(app.get('trust proxy')).not.toBe(true);
  });
});

describe('limitador general de /api', () => {
  it('corta al superar el máximo configurado', async () => {
    const chain = `${CLIENT_A}, ${CADDY_IP}`;

    for (let i = 0; i < MAX_REQUESTS; i++) {
      const res = await hit(chain);
      expect(res.status).not.toBe(429);
    }

    const blocked = await hit(chain);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      data: null,
      error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    });
  });

  /**
   * El corazón del arreglo: agotar la cuota desde una IP no debe afectar a
   * las demás. Antes, sin trust proxy, este test habría fallado — todos los
   * usuarios compartían un solo cubo.
   */
  it('cuenta por cliente, no de forma global', async () => {
    const otro = await hit(`${CLIENT_B}, ${CADDY_IP}`);

    expect(otro.status).not.toBe(429);
  });

  /**
   * Anteponer una IP falsa a la cadena no consigue un cubo nuevo: con dos
   * saltos de confianza, Express descarta los dos de la derecha (nginx por
   * socket y Caddy) y toma el siguiente, que es el que escribió Caddy — no el
   * que eligió el atacante.
   */
  it('no deja falsificar la IP anteponiendo valores a X-Forwarded-For', async () => {
    const spoofed = await hit(`9.9.9.9, ${CLIENT_A}, ${CADDY_IP}`);

    expect(spoofed.status).toBe(429);
  });

  it('no gasta cuota en el health check', async () => {
    // Docker lo consulta cada pocos segundos; no debe quedarse sin respuesta
    // porque alguien agotara el límite.
    const res = await request(app).get('/api/health').set('X-Forwarded-For', `${CLIENT_A}, ${CADDY_IP}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
