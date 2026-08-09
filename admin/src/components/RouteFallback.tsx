import styles from './RouteFallback.module.css';

/**
 * Estado de espera mientras se descarga el chunk de una ruta.
 *
 * Usa `role="status"` para que un lector de pantalla anuncie la carga en lugar
 * de quedarse en silencio ante una pantalla vacía.
 */
export function RouteFallback() {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      Cargando…
    </div>
  );
}
