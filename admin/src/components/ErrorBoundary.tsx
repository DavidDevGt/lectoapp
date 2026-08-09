import { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';
import { reportError } from '../services/error-reporter';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Última red de seguridad del panel: sin esto, cualquier excepción durante el
 * render deja al administrador con una pantalla en blanco y sin forma de saber
 * qué pasó. React exige que sea un componente de clase — no hay equivalente
 * con hooks para componentDidCatch.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error, { componentStack: errorInfo.componentStack ?? undefined });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.wrapper} role="alert">
        <div className={styles.card}>
          <h1 className={styles.title}>Algo se rompió en esta pantalla</h1>
          <p className={styles.message}>
            El panel encontró un error inesperado y no pudo seguir. Tu trabajo guardado no se
            perdió: recarga la página para volver a empezar.
          </p>
          <button type="button" className={styles.button} onClick={this.handleReload}>
            Recargar el panel
          </button>
        </div>
      </div>
    );
  }
}
