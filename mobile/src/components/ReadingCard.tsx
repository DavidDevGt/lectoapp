import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { ReadingListItem } from '../types/api';
import { Badge } from './Badge';

interface ReadingCardProps {
  reading: ReadingListItem;
  onPress: () => void;
}

export function ReadingCard({ reading, onPress }: ReadingCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Badge type="comprehension" level={reading.comprehensionLevel} />
        <View style={styles.timeContainer}>
          <Text style={styles.timeIcon}>⏱️</Text>
          <Text style={styles.timeText}>{reading.estimatedTimeMin} min</Text>
        </View>
      </View>

      <Text style={styles.title}>{reading.title}</Text>

      <View style={styles.footer}>
        <View style={styles.questionMeta}>
          <Text style={styles.questionText}>
            {reading.questionCount ? `${reading.questionCount} preguntas` : 'Cuestionario interactivo'}
          </Text>
        </View>
        <Pressable style={styles.startBtn} onPress={onPress}>
          <Text style={styles.startBtnText}>Leer ahora →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 23,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.bgSunken,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: colors.brandBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  startBtnText: {
    color: colors.brandPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
});
