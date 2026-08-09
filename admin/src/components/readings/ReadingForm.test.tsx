import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ReadingForm } from './ReadingForm';

describe('ReadingForm', () => {
  it('should render empty fields when no defaultValues are provided', () => {
    renderWithProviders(
      <ReadingForm submitLabel="Crear lectura" pendingLabel="Creando…" isPending={false} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByLabelText(/título/i)).toHaveValue('');
    expect(screen.getByLabelText(/tiempo estimado/i)).toHaveValue(null);
    expect(screen.getByLabelText(/imagen de portada/i)).toHaveValue('');
  });

  it('should populate fields from defaultValues, treating null as empty', () => {
    renderWithProviders(
      <ReadingForm
        defaultValues={{
          title: 'El Popol Vuh',
          content: 'contenido largo'.repeat(5),
          comprehensionLevel: 'LITERAL',
          progressionLevel: 'BEGINNER',
          estimatedTimeMin: 8,
          coverImageUrl: undefined,
        }}
        submitLabel="Guardar"
        pendingLabel="Guardando…"
        isPending={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/título/i)).toHaveValue('El Popol Vuh');
    expect(screen.getByLabelText(/tiempo estimado/i)).toHaveValue(8);
    expect(screen.getByLabelText(/imagen de portada/i)).toHaveValue('');
  });

  it('should call onSubmit with the typed values when the form is valid', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();
    renderWithProviders(
      <ReadingForm submitLabel="Crear lectura" pendingLabel="Creando…" isPending={false} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );

    await user.type(screen.getByLabelText(/título/i), 'Nuevo título');
    await user.type(screen.getByLabelText(/contenido/i), 'x'.repeat(60));
    await user.click(screen.getByRole('button', { name: /crear lectura/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nuevo título', content: 'x'.repeat(60) }),
    );
  });

  it('should disable the submit button and show pendingLabel when isPending is true', () => {
    renderWithProviders(
      <ReadingForm submitLabel="Crear lectura" pendingLabel="Creando…" isPending onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /creando/i })).toBeDisabled();
  });

  it('should call onCancel when clicking the cancel button', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancel = vi.fn();
    renderWithProviders(
      <ReadingForm submitLabel="Crear lectura" pendingLabel="Creando…" isPending={false} onSubmit={vi.fn()} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
