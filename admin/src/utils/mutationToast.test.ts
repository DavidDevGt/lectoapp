import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { mutateWithToast } from './mutationToast';
import { ApiError } from '../services/api-client';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('mutateWithToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería llamar toast.success cuando la mutación es exitosa', () => {
    // Simular un mutate que llama onSuccess inmediatamente
    const mutate = vi.fn().mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });

    mutateWithToast(mutate, 'test-var', {
      successMessage: 'Lectura publicada',
      errorFallback: 'Error al publicar',
    });

    expect(mutate).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Lectura publicada');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('debería llamar toast.error con el mensaje de ApiError cuando falla', () => {
    const apiError = new ApiError('Email ya registrado', 409);
    const mutate = vi.fn().mockImplementation((_vars, opts) => {
      opts?.onError?.(apiError);
    });

    mutateWithToast(mutate, 'test-var', {
      successMessage: 'Éxito',
      errorFallback: 'Error genérico',
    });

    expect(toast.error).toHaveBeenCalledWith('Email ya registrado');
  });

  it('debería usar el fallback cuando el error no es ApiError', () => {
    const genericError = new Error('Network failure');
    const mutate = vi.fn().mockImplementation((_vars, opts) => {
      opts?.onError?.(genericError);
    });

    mutateWithToast(mutate, 'test-var', {
      successMessage: 'Éxito',
      errorFallback: 'Algo salió mal',
    });

    expect(toast.error).toHaveBeenCalledWith('Algo salió mal');
  });

  it('debería pasar las variables al mutate', () => {
    const mutate = vi.fn();

    mutateWithToast(mutate, { id: 'reading-1' }, {
      successMessage: 'Éxito',
      errorFallback: 'Error',
    });

    expect(mutate).toHaveBeenCalledWith(
      { id: 'reading-1' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
