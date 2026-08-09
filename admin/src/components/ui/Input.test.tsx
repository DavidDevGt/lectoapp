import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input Primitive', () => {
  it('renders input with label correctly', () => {
    render(<Input label="Nombre de usuario" />);
    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
  });

  it('renders inline error message when provided', () => {
    render(<Input label="Email" error="Email inválido" />);
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });
});
