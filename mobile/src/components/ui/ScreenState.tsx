import React, { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ApiError, toUserMessage } from '../../api/errors';
import { borderRadius, colors, layout, shadows, spacing } from '../../theme/colors';
import { Button } from './Button';

interface LoadingProps {
  /** Qué se está cargando, en palabras del usuario: "tus lecturas", "la lectura". */
  label: string;
}

export function LoadingState({ label }: LoadingProps) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.brandPrimary} />
      <Text style={styles.message}>{label}</Text>
    </View>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Acción alternativa cuando reintentar no aplica (p. ej. volver atrás). */
  secondaryAction?: { label: string; onPress: () => void };
}

/**
 * Estado de error con vía de recuperación. Reemplaza los `catch {}` silenciosos:
 * el estudiante siempre ve qué pasó y qué puede hacer.
 */
export function ErrorState({ error, onRetry, secondaryAction }: ErrorStateProps) {
  const message = toUserMessage(error);
  const isOffline = error instanceof ApiError && error.kind === 'offline';
  const canRetry = !(error instanceof ApiError) || error.isRetryable;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
          {isOffline ? '📡' : '⚠️'}
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          {isOffline ? 'Sin conexión' : 'Algo salió mal'}
        </Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          {canRetry && onRetry && (
            <Button label="Reintentar" onPress={onRetry} accessibilityHint="Vuelve a cargar el contenido" />
          )}
          {secondaryAction && (
            <Button
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="secondary"
            />
          )}
        </View>
      </View>
    </View>
  );
}

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ emoji, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
          {emoji}
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {action && (
          <View style={styles.actions}>
            <Button label={action.label} onPress={action.onPress} variant="secondary" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...shadows.sm,
  },
  emoji: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
