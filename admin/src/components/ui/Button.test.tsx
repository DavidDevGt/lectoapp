import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Primitive', () => {
  it('renders children correctly', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Enviar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables button when isLoading is true', () => {
    render(<Button isLoading>Cargando</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });
});
