import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
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

  /*
   * El cierre al hacer clic fuera lo implementa DismissableLayer de Radix, que
   * depende de PointerEvent — una API que jsdom no implementa, así que la
   * interacción no se puede disparar de forma realista en este entorno. Radix
   * cubre ese comportamiento en su propia suite.
   *
   * Lo que sí es responsabilidad nuestra y sí se verifica aquí: que el overlay
   * exista y sea hermano del panel, no su contenedor. Es la condición que hace
   * posible distinguir un clic fuera de uno dentro; si alguien quitara el
   * overlay o volviera a anidar el panel dentro de él, este test lo detecta.
   */
  it('should render the overlay as a sibling of the panel, not as its container', () => {
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={vi.fn()}>
        <p>contenido</p>
      </Modal>,
    );

    const overlay = screen.getByTestId('modal-overlay');
    const dialog = screen.getByRole('dialog');

    expect(overlay).toBeInTheDocument();
    expect(overlay.contains(dialog)).toBe(false);
  });

  it('should not call onClose when clicking inside the panel', async () => {
    const user = userEvent.setup({ delay: null });
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

  it('should label the dialog with its own title for assistive technology', () => {
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={vi.fn()}>
        <p>contenido</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)).toHaveTextContent('Nueva lectura');
  });

  it('should move focus inside the dialog when it opens', async () => {
    renderWithProviders(
      <Modal title="Nueva lectura" onClose={vi.fn()}>
        <button type="button">Primer control</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });
});
