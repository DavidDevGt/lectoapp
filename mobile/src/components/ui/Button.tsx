import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { borderRadius, colors, shadows, spacing, touchTarget } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Texto de carga; si falta se usa el label. */
  loadingLabel?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  haptic?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.brandPrimary, ...shadows.sm },
    text: { color: colors.textOnBrand },
  },
  secondary: {
    container: {
      backgroundColor: colors.bgSunken,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { color: colors.textSecondary },
  },
  danger: {
    container: {
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.dangerSolid,
    },
    text: { color: colors.dangerFg },
  },
};

const PRESSED: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.brandHover },
  secondary: { backgroundColor: colors.border },
  danger: { opacity: 0.85 },
};

/**
 * Botón único de la app. Antes cada pantalla reimplementaba el suyo con radios y
 * paddings distintos; esto fija altura mínima táctil, feedback de presión y estado
 * de carga en un solo lugar.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingLabel,
  accessibilityLabel,
  accessibilityHint,
  haptic = false,
  style,
}: ButtonProps) {
  const isInactive = disabled || loading;
  const theme = VARIANTS[variant];

  const handlePress = () => {
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        theme.container,
        pressed && !isInactive && PRESSED[variant],
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.text.color} size="small" />
          <Text style={[styles.label, theme.text]}>{loadingLabel ?? label}</Text>
        </View>
      ) : (
        <Text style={[styles.label, theme.text]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.comfortable,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    opacity: 0.45,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
