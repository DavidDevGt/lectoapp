import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing } from '../theme/colors';
import { ComprehensionLevel, ProgressionLevel } from '../types/api';

const COMPREHENSION: Record<ComprehensionLevel, { label: string; bg: string; fg: string }> = {
  LITERAL: { label: 'Literal', bg: colors.literalBg, fg: colors.literalFg },
  INFERENTIAL: { label: 'Inferencial', bg: colors.inferentialBg, fg: colors.inferentialFg },
  CRITICAL: { label: 'Crítico', bg: colors.criticalBg, fg: colors.criticalFg },
};

const PROGRESSION: Record<ProgressionLevel, { label: string; bg: string; fg: string }> = {
  BEGINNER: { label: 'Principiante', bg: colors.bgSunken, fg: colors.beginner },
  INTERMEDIATE: { label: 'Intermedio', bg: colors.literalBg, fg: colors.intermediate },
  ADVANCED: { label: 'Avanzado', bg: colors.inferentialBg, fg: colors.advanced },
  EXPERT: { label: 'Experto', bg: colors.criticalBg, fg: colors.expert },
  SUPREME: { label: 'Supremo', bg: colors.pendingBg, fg: colors.supreme },
};

export function comprehensionLabel(level: ComprehensionLevel): string {
  return COMPREHENSION[level]?.label ?? level;
}

export function progressionLabel(level: ProgressionLevel): string {
  return PROGRESSION[level]?.label ?? level;
}

type BadgeProps =
  | { type: 'comprehension'; level: ComprehensionLevel; size?: 'sm' | 'md' }
  | { type: 'progression'; level: ProgressionLevel; size?: 'sm' | 'md' };

export function Badge(props: BadgeProps) {
  const { size = 'md' } = props;
  const theme =
    props.type === 'comprehension'
      ? COMPREHENSION[props.level]
      : PROGRESSION[props.level];

  const fallback = { label: String(props.level), bg: colors.bgSunken, fg: colors.textSecondary };
  const { label, bg, fg } = theme ?? fallback;
  const isSmall = size === 'sm';

  return (
    <View
      accessible
      accessibilityLabel={`Nivel ${
        props.type === 'comprehension' ? 'de comprensión' : 'de estudiante'
      }: ${label}`}
      style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSmall]}
    >
      <Text style={[styles.text, { color: fg }, isSmall && styles.textSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
  },
});
