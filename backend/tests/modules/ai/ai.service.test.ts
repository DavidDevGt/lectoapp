import { describe, expect, it, vi } from 'vitest';
import { formatOllamaUrl } from '../../../src/modules/ai/ai.service';

vi.mock('../../../src/config/logger', () => ({
  logger: { warn: vi.fn(), debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('formatOllamaUrl', () => {
  it('conserva un host completo con esquema y puerto', () => {
    expect(formatOllamaUrl('http://ollama:11434')).toBe('http://ollama:11434/api/generate');
  });

  it('añade el puerto 11434 a un host HTTP que no lo declara', () => {
    // Sin esto la petición saldría al puerto 80 y fallaría con un error de
    // conexión que no menciona a Ollama por ningún lado.
    expect(formatOllamaUrl('http://192.168.1.50')).toBe('http://192.168.1.50:11434/api/generate');
  });

  it('antepone el esquema y el puerto a un host escrito a secas', () => {
    expect(formatOllamaUrl('192.168.1.50')).toBe('http://192.168.1.50:11434/api/generate');
  });

  it('respeta el puerto implícito 443 en HTTPS', () => {
    // Un Ollama tras un proxy TLS se expone en 443, no en 11434.
    expect(formatOllamaUrl('https://ollama.ejemplo.gt')).toBe(
      'https://ollama.ejemplo.gt/api/generate',
    );
  });

  it('ignora las barras finales', () => {
    expect(formatOllamaUrl('http://ollama:11434///')).toBe('http://ollama:11434/api/generate');
  });

  describe('direcciones de escucha, que no son direcciones de conexión', () => {
    // Ollama usa OLLAMA_HOST para configurar su propio servidor, así que en una
    // máquina que ejecuta Ollama la variable vale 0.0.0.0 y Docker Compose la
    // antepone al archivo .env. Antes esto producía http://0.0.0.0/api/generate.
    it.each(['0.0.0.0', 'http://0.0.0.0', '0.0.0.0:11434', 'http://0.0.0.0:11434', '::', '[::]'])(
      'sustituye %s por el destino local por defecto',
      (bindAddress) => {
        expect(formatOllamaUrl(bindAddress)).toBe('http://localhost:11434/api/generate');
      },
    );
  });

  it.each(['', '   '])('usa el destino por defecto cuando el host viene vacío (%j)', (empty) => {
    expect(formatOllamaUrl(empty)).toBe('http://localhost:11434/api/generate');
  });

  it('usa el destino por defecto cuando el host no se puede interpretar', () => {
    expect(formatOllamaUrl('http://')).toBe('http://localhost:11434/api/generate');
  });
});
