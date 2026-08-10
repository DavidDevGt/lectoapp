import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { touchTarget } from '../../../theme/colors';

describe('Button', () => {
  it('expone rol de botón y ejecuta onPress', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Entrar a LectoApp" onPress={onPress} />);

    fireEvent.press(getByRole('button', { name: 'Entrar a LectoApp' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no dispara onPress mientras está deshabilitado', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Siguiente" onPress={onPress} disabled />);

    const button = getByRole('button', { name: 'Siguiente' });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('no dispara onPress mientras está enviando y se anuncia como ocupado', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <Button label="Enviar Cuestionario" loadingLabel="Enviando…" loading onPress={onPress} />,
    );

    const button = getByRole('button', { name: 'Enviar Cuestionario' });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    expect(getByText('Enviando…')).toBeTruthy();
  });

  it('garantiza el objetivo táctil mínimo', () => {
    const { getByRole } = render(<Button label="Reintentar" onPress={jest.fn()} />);

    const flattened = Object.assign(
      {},
      ...[getByRole('button', { name: 'Reintentar' }).props.style].flat(Infinity).filter(Boolean),
    );
    expect(flattened.minHeight).toBe(touchTarget.comfortable);
  });

  it('permite una etiqueta accesible distinta del texto visible', () => {
    const { getByRole } = render(
      <Button label="Salir" onPress={jest.fn()} accessibilityLabel="Cerrar sesión de estudiante" />,
    );

    expect(getByRole('button', { name: 'Cerrar sesión de estudiante' })).toBeTruthy();
  });
});
