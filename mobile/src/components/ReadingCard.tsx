import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '../theme/colors';
import { ReadingListItem } from '../types/api';
import { Badge, comprehensionLabel } from './Badge';

interface ReadingCardProps {
  reading: ReadingListItem;
  onPress: () => void;
}

function ReadingCardComponent({ reading, onPress }: ReadingCardProps) {
  const questionsLabel =
    reading.questionsCount === 1 ? '1 pregunta' : `${reading.questionsCount} preguntas`;

  return (
    <Pressable
      accessibilityRole="button"
      // Una sola etiqueta compuesta: el lector de pantalla no recorre badge por badge.
      accessibilityLabel={`${reading.title}. Comprensión ${comprehensionLabel(
        reading.comprehensionLevel,
      )}. ${reading.estimatedTimeMin} minutos de lectura. ${questionsLabel}.`}
      accessibilityHint="Abre la lectura"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardHeader} importantForAccessibility="no-hide-descendants">
        <Badge type="comprehension" level={reading.comprehensionLevel} />
        <View style={styles.timeBadge}>
          <Text style={styles.timeIcon}>⏱️</Text>
          <Text style={styles.timeText}>{reading.estimatedTimeMin} min</Text>
        </View>
      </View>

      <Text style={styles.title} importantForAccessibility="no-hide-descendants">
        {reading.title}
      </Text>

      <View style={styles.footer} importantForAccessibility="no-hide-descendants">
        <View style={styles.questionsContainer}>
          <Text style={styles.questionsIcon}>📝</Text>
          <Text style={styles.questionsText}>{questionsLabel}</Text>
        </View>

        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Leer →</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Memoizado porque la lista se re-renderiza al paginar y las tarjetas no cambian. */
export const ReadingCard = React.memo(ReadingCardComponent);

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
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSunken,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 25,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.bgSunken,
  },
  questionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  questionsIcon: {
    fontSize: 14,
  },
  questionsText: {
    fontSize: 14,
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
    color: colors.brandFg,
    fontWeight: '800',
    fontSize: 14,
  },
});
