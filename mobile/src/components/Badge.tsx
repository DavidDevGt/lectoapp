import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ComprehensionLevel, ProgressionLevel } from '../types/api';

interface BadgeProps {
  type: 'comprehension' | 'progression';
  level: ComprehensionLevel | ProgressionLevel | string;
  size?: 'sm' | 'md';
}

export function Badge({ type, level, size = 'md' }: BadgeProps) {
  let bgColor = colors.bgSunken;
  let textColor = colors.textSecondary;
  let label = level;

  if (type === 'comprehension') {
    switch (level) {
      case 'LITERAL':
        bgColor = colors.literalBg;
        textColor = colors.literalFg;
        label = 'Literal';
        break;
      case 'INFERENTIAL':
        bgColor = colors.inferentialBg;
        textColor = colors.inferentialFg;
        label = 'Inferencial';
        break;
      case 'CRITICAL':
        bgColor = colors.criticalBg;
        textColor = colors.criticalFg;
        label = 'Crítico';
        break;
    }
  } else {
    switch (level) {
      case 'BEGINNER':
        bgColor = colors.bgSunken;
        textColor = colors.beginner;
        label = 'Principiante';
        break;
      case 'INTERMEDIATE':
        bgColor = colors.literalBg;
        textColor = colors.intermediate;
        label = 'Intermedio';
        break;
      case 'ADVANCED':
        bgColor = colors.inferentialBg;
        textColor = colors.advanced;
        label = 'Avanzado';
        break;
      case 'EXPERT':
        bgColor = colors.criticalBg;
        textColor = colors.expert;
        label = 'Experto';
        break;
      case 'SUPREME':
        bgColor = colors.pendingBg;
        textColor = colors.supreme;
        label = 'Supremo';
        break;
    }
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: textColor }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
  },
});
