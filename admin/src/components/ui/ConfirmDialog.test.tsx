import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('should render title and message with default confirm label', () => {
    renderWithProviders(
      <ConfirmDialog title="Eliminar pregunta" message="¿Estás seguro?" onConfirm={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('dialog', { name: /eliminar pregunta/i })).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^eliminar$/i })).toBeInTheDocument();
  });

  it('should render a custom confirm label when provided', () => {
    renderWithProviders(
      <ConfirmDialog
        title="Archivar"
        message="mensaje"
        confirmLabel="Archivar"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /^archivar$/i })).toBeInTheDocument();
  });

  it('should call onConfirm when clicking the confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog title="Eliminar pregunta" message="¿Estás seguro?" onConfirm={onConfirm} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking cancel and not call onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <ConfirmDialog title="Eliminar pregunta" message="¿Estás seguro?" onConfirm={onConfirm} onClose={onClose} />,
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should disable the confirm button when isPending is true', () => {
    renderWithProviders(
      <ConfirmDialog title="Eliminar" message="mensaje" isPending onConfirm={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /eliminando/i })).toBeDisabled();
  });
});
