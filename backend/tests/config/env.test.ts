import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * El servidor debe negarse a arrancar con una configuración insegura.
 *
 * `src/config/env.ts` valida al importarse, así que cada caso reinicia el
 * registro de módulos y vuelve a importarlo con un entorno distinto. Sin
 * `vi.resetModules()` el módulo quedaría cacheado desde el primer test y los
 * demás pasarían sin comprobar nada.
 */

const VALID_ACCESS = 'access-secret-9xKp2mQvBn7rTz4WsLd6JhFg';
const VALID_REFRESH = 'refresh-secret-3TbYw8ZcRk1NpMv5QjXeHu';

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/lectoapp_test?schema=public',
  JWT_ACCESS_SECRET: VALID_ACCESS,
  JWT_REFRESH_SECRET: VALID_REFRESH,
};

let originalEnv: NodeJS.ProcessEnv;

async function loadEnvWith(overrides: Record<string, string | undefined>) {
  vi.resetModules();

  for (const key of Object.keys(baseEnv)) delete process.env[key];
  delete process.env.TRUST_PROXY_HOPS;
  delete process.env.COOKIE_SECURE;

  Object.assign(process.env, baseEnv);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  return import('../../src/config/env');
}

describe('configuración de entorno', () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
    // env.ts imprime los campos inválidos antes de lanzar; en los tests que
    // esperan un fallo eso es ruido esperado, no una señal de error.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('secretos JWT', () => {
    it('acepta secretos largos, distintos y con entropía', async () => {
      const { env } = await loadEnvWith({});

      expect(env.JWT_ACCESS_SECRET).toBe(VALID_ACCESS);
      expect(env.JWT_REFRESH_SECRET).toBe(VALID_REFRESH);
    });

    it('rechaza un JWT_ACCESS_SECRET de menos de 32 caracteres', async () => {
      await expect(loadEnvWith({ JWT_ACCESS_SECRET: 'demasiado-corto' })).rejects.toThrow(
        /Configuración de entorno inválida/,
      );
    });

    it('rechaza un JWT_REFRESH_SECRET de menos de 32 caracteres', async () => {
      await expect(loadEnvWith({ JWT_REFRESH_SECRET: 'corto' })).rejects.toThrow(
        /Configuración de entorno inválida/,
      );
    });

    it('rechaza exactamente 31 caracteres y acepta 32', async () => {
      await expect(loadEnvWith({ JWT_ACCESS_SECRET: 'aB3dE6gH9jK2mN5pQ8sT1vW4xY7zA0c' })).rejects.toThrow();

      const { env } = await loadEnvWith({ JWT_ACCESS_SECRET: 'aB3dE6gH9jK2mN5pQ8sT1vW4xY7zA0cD' });
      expect(env.JWT_ACCESS_SECRET).toHaveLength(32);
    });

    /**
     * Reutilizar el mismo valor permite presentar un refresh token como access
     * token: los dos verifican contra el mismo secreto y verifyAccessToken solo
     * mira la firma, no el propósito.
     */
    it('rechaza que el secreto de access y el de refresh sean iguales', async () => {
      await expect(
        loadEnvWith({ JWT_ACCESS_SECRET: VALID_ACCESS, JWT_REFRESH_SECRET: VALID_ACCESS }),
      ).rejects.toThrow(/Configuración de entorno inválida/);
    });

    it('rechaza un secreto largo pero sin entropía', async () => {
      await expect(
        loadEnvWith({ JWT_ACCESS_SECRET: 'a'.repeat(48) }),
      ).rejects.toThrow(/Configuración de entorno inválida/);
    });
  });

  describe('TRUST_PROXY_HOPS', () => {
    it('vale 0 por defecto — sin proxy, se usa la IP del socket', async () => {
      const { env } = await loadEnvWith({});
      expect(env.TRUST_PROXY_HOPS).toBe(0);
    });

    it('acepta el número de saltos de la topología de compose', async () => {
      const { env } = await loadEnvWith({ TRUST_PROXY_HOPS: '2' });
      expect(env.TRUST_PROXY_HOPS).toBe(2);
    });

    it('rechaza un valor negativo', async () => {
      await expect(loadEnvWith({ TRUST_PROXY_HOPS: '-1' })).rejects.toThrow();
    });

    it('rechaza un valor no numérico, que se colaría como NaN', async () => {
      await expect(loadEnvWith({ TRUST_PROXY_HOPS: 'true' })).rejects.toThrow();
    });
  });

  describe('COOKIE_SECURE', () => {
    it('sigue a NODE_ENV cuando no se define: false fuera de producción', async () => {
      const { env } = await loadEnvWith({ NODE_ENV: 'development' });
      expect(env.COOKIE_SECURE).toBe(false);
    });

    it('sigue a NODE_ENV cuando no se define: true en producción', async () => {
      const { env } = await loadEnvWith({ NODE_ENV: 'production' });
      expect(env.COOKIE_SECURE).toBe(true);
    });

    it('rechaza desactivar Secure en producción — la cookie viajaría en claro', async () => {
      await expect(
        loadEnvWith({ NODE_ENV: 'production', COOKIE_SECURE: 'false' }),
      ).rejects.toThrow(/Configuración de entorno inválida/);
    });
  });
});
