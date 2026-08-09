import { useEffect, useState } from 'react';

/**
 * Retrasa la propagación de un valor hasta que deja de cambiar durante `delayMs`.
 *
 * Se usa en el buscador de lecturas: sin esto, cada tecla dispara una consulta a
 * la API. Con un título de 20 caracteres eso son 20 peticiones para una sola
 * búsqueda.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
