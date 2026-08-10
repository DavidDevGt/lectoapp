import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, layout, spacing } from '../theme/colors';
import { Button } from './ui/Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Última red de seguridad: sin esto, cualquier excepción durante el render deja
 * una pantalla en blanco sin salida. Aquí el estudiante al menos puede recargar.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // TODO(observabilidad): enviar a Sentry cuando exista el proyecto.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
            🛠️
          </Text>
          <Text style={styles.title} accessibilityRole="header">
            La app tuvo un problema
          </Text>
          <Text style={styles.message}>
            Algo se rompió mientras mostrábamos esta pantalla. Puedes intentar volver a
            cargarla; si sigue fallando, cierra la app y ábrela de nuevo.
          </Text>
          {__DEV__ && <Text style={styles.debug}>{error.message}</Text>}
          <Button label="Volver a intentar" onPress={this.handleReset} style={styles.action} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
  },
  emoji: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  debug: {
    fontSize: 12,
    color: colors.dangerFg,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
