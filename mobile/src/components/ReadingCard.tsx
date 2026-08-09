import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';
import { ReadingListItem } from '../types/api';
import { Badge } from './Badge';

interface ReadingCardProps {
  reading: ReadingListItem;
  onPress: () => void;
}

export function ReadingCard({ reading, onPress }: ReadingCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lectura: ${reading.title}. Tiempo estimado: ${reading.estimatedTimeMin} minutos. Nivel de comprensión: ${reading.comprehensionLevel}`}
      accessibilityHint="Presiona para abrir y leer el texto"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Header del Card (Badges de Nivel y Tiempo) */}
      <View style={styles.cardHeader}>
        <Badge type="comprehension" level={reading.comprehensionLevel} />
        <View style={styles.timeBadge}>
          <Text style={styles.timeIcon}>⏱️</Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.timeText}>
            {reading.estimatedTimeMin} min
          </Text>
        </View>
      </View>

      {/* Título de la Lectura */}
      <Text maxFontSizeMultiplier={1.2} style={styles.title}>
        {reading.title}
      </Text>

      {/* Footer del Card */}
      <View style={styles.footer}>
        <View style={styles.questionsContainer}>
          <Text style={styles.questionsIcon}>📝</Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.questionsText}>
            {reading.questionsCount ? `${reading.questionsCount} preguntas` : 'Cuestionario'}
          </Text>
        </View>

        <View style={styles.actionBtn}>
          <Text maxFontSizeMultiplier={1.2} style={styles.actionBtnText}>
            Leer Reto →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.92,
    backgroundColor: colors.bgSunken,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSunken,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.bgSunken,
  },
  questionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  questionsIcon: {
    fontSize: 14,
  },
  questionsText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: colors.brandBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.brandLightText,
  },
  actionBtnText: {
    color: colors.brandPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
});
