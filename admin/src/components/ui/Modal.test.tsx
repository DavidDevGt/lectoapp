import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should render title and children when open', () => {
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={vi.fn()}>
        <p>contenido</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: /nueva lectura/i })).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('should call onClose when clicking the overlay outside the panel', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={onClose}>
        <p>contenido</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside the panel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={onClose}>
        <p>contenido</p>
      </Modal>,
    );

    await user.click(screen.getByText('contenido'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose when pressing Escape', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={onClose}>
        <p>contenido</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
