import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, layout, shadows, spacing, touchTarget } from '../theme/colors';
import { apiClient } from '../api/client';
import { useAsyncData } from '../hooks/useAsyncData';
import { Badge } from '../components/Badge';
import { Button } from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/ScreenState';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

/** Escalas del control de lectura. Se multiplican SOBRE el tamaño ya escalado por el sistema. */
const FONT_STEPS = [
  { multiplier: 1, label: 'Normal' },
  { multiplier: 1.25, label: 'Grande' },
  { multiplier: 1.6, label: 'Extra grande' },
] as const;

export function ReaderScreen({ route, navigation }: Props) {
  const { readingId } = route.params;
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);

  const fetcher = useCallback(
    (signal: AbortSignal) => apiClient.getReadingById(readingId, signal),
    [readingId],
  );
  const { data: reading, error, isLoading, reload } = useAsyncData(fetcher, [readingId]);

  const step = FONT_STEPS[stepIndex];

  const changeStep = useCallback((delta: number) => {
    setStepIndex((prev) => Math.min(FONT_STEPS.length - 1, Math.max(0, prev + delta)));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View
          style={styles.fontToggleGroup}
          accessibilityRole="adjustable"
          accessible
          accessibilityLabel="Tamaño de la letra"
          accessibilityValue={{ text: step.label }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') changeStep(1);
            if (event.nativeEvent.actionName === 'decrement') changeStep(-1);
          }}
        >
          <Pressable
            style={styles.fontBtn}
            disabled={stepIndex === 0}
            onPress={() => changeStep(-1)}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Text style={[styles.fontBtnText, stepIndex === 0 && styles.fontBtnTextDisabled]}>
              A−
            </Text>
          </Pressable>
          <Pressable
            style={styles.fontBtn}
            disabled={stepIndex === FONT_STEPS.length - 1}
            onPress={() => changeStep(1)}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Text
              style={[
                styles.fontBtnTextLarge,
                stepIndex === FONT_STEPS.length - 1 && styles.fontBtnTextDisabled,
              ]}
            >
              A+
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, stepIndex, step.label, changeStep]);

  const paragraphs = useMemo(
    () => (reading ? reading.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0) : []),
    [reading],
  );

  if (isLoading) {
    return <LoadingState label="Cargando la lectura…" />;
  }

  if (error || !reading) {
    return (
      <ErrorState
        error={error}
        onRetry={reload}
        secondaryAction={{ label: 'Volver a la ruta', onPress: () => navigation.goBack() }}
      />
    );
  }

  const questionsCount = reading.questions.length;
  const hasQuiz = questionsCount > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.column}>
          <Text style={styles.title} accessibilityRole="header">
            {reading.title}
          </Text>

          <View style={styles.metaBar}>
            <Badge type="comprehension" level={reading.comprehensionLevel} />
            <View
              style={styles.metaBadge}
              accessible
              accessibilityLabel={`${reading.estimatedTimeMin} minutos de lectura`}
            >
              <Text
                style={styles.metaIcon}
                importantForAccessibility="no"
                accessibilityElementsHidden
              >
                ⏱️
              </Text>
              <Text style={styles.metaText}>{reading.estimatedTimeMin} min</Text>
            </View>
            {hasQuiz && (
              <View
                style={styles.metaBadge}
                accessible
                accessibilityLabel={`${questionsCount} preguntas en el cuestionario`}
              >
                <Text
                  style={styles.metaIcon}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                >
                  📝
                </Text>
                <Text style={styles.metaText}>{questionsCount} preguntas</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.textContainer}>
            {paragraphs.map((paragraph, index) => (
              <Text
                key={`${index}-${paragraph.slice(0, 12)}`}
                style={[
                  styles.paragraph,
                  { fontSize: 17 * step.multiplier, lineHeight: 28 * step.multiplier },
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {hasQuiz ? (
          <Button
            label="Comenzar Cuestionario"
            haptic
            accessibilityLabel={`Comenzar el cuestionario de ${questionsCount} preguntas`}
            accessibilityHint="Se abrirá la evaluación de esta lectura"
            onPress={() =>
              navigation.navigate('Quiz', { readingId: reading.id, title: reading.title })
            }
            style={styles.bottomAction}
          />
        ) : (
          <Text style={styles.noQuizNotice}>
            Esta lectura todavía no tiene cuestionario disponible.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
  fontToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSunken,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fontBtn: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandPrimary,
  },
  fontBtnTextLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brandPrimary,
  },
  fontBtnTextDisabled: {
    color: colors.textSubtle,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  metaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSunken,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  textContainer: {
    gap: spacing.xl,
  },
  paragraph: {
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
    ...shadows.lg,
  },
  bottomAction: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    alignSelf: 'center',
  },
  noQuizNotice: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    paddingVertical: spacing.sm,
  },
});
