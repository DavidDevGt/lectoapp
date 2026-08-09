import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from './DropdownMenu';

describe('DropdownMenu Primitive', () => {
  it('opens menu items when trigger is clicked', async () => {
    const handleAction = vi.fn();
    render(
      <DropdownMenu
        items={[
          { label: 'Editar', onClick: handleAction },
          { label: 'Eliminar', variant: 'danger' },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Más opciones' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const editItem = screen.getByRole('menuitem', { name: 'Editar' });
    await userEvent.click(editItem);
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
