import { useEffect } from 'react';
import { bootstrapSession } from '../services/auth.service';

/**
 * En React 18 con StrictMode los efectos se montan dos veces en desarrollo.
 * Comprobar `status !== 'loading'` no serviría de guardia: en el segundo montaje
 * la promesa del primero todavía no ha resuelto y el estado sigue en 'loading'.
 * Hace falta una marca sincrónica, fuera del ciclo de vida del componente.
 *
 * (La deduplicación de `refreshAccessToken` ya impediría una doble rotación del
 * token; esto evita además el segundo GET /users/me.)
 */
let bootstrapStarted = false;

/**
 * Rehidrata la sesión una sola vez al montar la aplicación.
 *
 * Mientras dura, el store queda en `status: 'loading'` y las rutas protegidas
 * esperan en vez de redirigir: sin eso, alguien con sesión válida vería un
 * parpadeo al login en cada recarga.
 */
export function useSessionBootstrap(): void {
  useEffect(() => {
    if (bootstrapStarted) return;
    bootstrapStarted = true;

    void bootstrapSession();
  }, []);
}
