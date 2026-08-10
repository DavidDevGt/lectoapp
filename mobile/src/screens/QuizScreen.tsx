import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, duration, layout, spacing, touchTarget } from '../theme/colors';
import { SubmitProgressResult } from '../types/api';
import { apiClient } from '../api/client';
import { toUserMessage } from '../api/errors';
import { CelebrationModal } from '../components/CelebrationModal';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/ScreenState';
import { useAuth } from '../context/AuthContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export function QuizScreen({ route, navigation }: Props) {
  const { readingId, title } = route.params;
  const insets = useSafeAreaInsets();
  const { applyServerTotals } = useAuth();
  const reducedMotion = useReducedMotion();

  const fetcher = useCallback(
    (signal: AbortSignal) => apiClient.getReadingById(readingId, signal),
    [readingId],
  );
  const { data: reading, error: loadError, isLoading, reload } = useAsyncData(fetcher, [readingId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [result, setResult] = useState<SubmitProgressResult | null>(null);
  const [resultVisible, setResultVisible] = useState(false);

  const startedAtRef = useRef(Date.now());
  // Permite salir sin confirmar cuando la salida es intencional (terminó el quiz).
  const allowLeaveRef = useRef(false);

  const questions = reading?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(userAnswers).length;

  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;
  const progressAnim = useAnimatedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progressAnim.setValue(progress);
      return;
    }
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: duration.base,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim, reducedMotion]);

  const confirmExit = useCallback(
    (onConfirm: () => void) => {
      const hasProgress = answeredCount > 0;
      if (!hasProgress) {
        onConfirm();
        return;
      }
      Alert.alert(
        '¿Salir de la evaluación?',
        'Si sales ahora perderás las respuestas que ya marcaste.',
        [
          { text: 'Seguir respondiendo', style: 'cancel' },
          { text: 'Salir y descartar', style: 'destructive', onPress: onConfirm },
        ],
      );
    },
    [answeredCount],
  );

  // Un solo guardián para TODAS las salidas: botón Salir, back de Android y gestos.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current || answeredCount === 0) return;
      event.preventDefault();
      confirmExit(() => {
        allowLeaveRef.current = true;
        navigation.dispatch(event.data.action);
      });
    });
    return unsubscribe;
  }, [navigation, answeredCount, confirmExit]);

  const leaveQuiz = useCallback(() => {
    allowLeaveRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    void Haptics.selectionAsync();
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const submit = useCallback(async () => {
    if (!reading) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const timeSpentSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      const response = await apiClient.submitQuiz(reading.id, userAnswers, timeSpentSec);
      setResult(response);
      setResultVisible(true);
      // Los totales son los del servidor; la app nunca suma puntos por su cuenta.
      applyServerTotals({
        totalPoints: response.rewards.totalPoints,
        currentLevel: response.rewards.newLevel ?? undefined,
      });
      void Haptics.notificationAsync(
        response.attempt.passed
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    } catch (caught) {
      setSubmitError(caught);
      AccessibilityInfo.announceForAccessibility(toUserMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [reading, userAnswers, applyServerTotals]);

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    void submit();
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleRetry = () => {
    setResultVisible(false);
    setResult(null);
    setUserAnswers({});
    setCurrentIndex(0);
    setSubmitError(null);
    startedAtRef.current = Date.now();
  };

  const handleCloseResult = () => {
    setResultVisible(false);
    leaveQuiz();
  };

  if (isLoading) {
    return <LoadingState label="Preparando el cuestionario…" />;
  }

  if (loadError || !reading) {
    return (
      <ErrorState
        error={loadError}
        onRetry={reload}
        secondaryAction={{ label: 'Volver a la lectura', onPress: leaveQuiz }}
      />
    );
  }

  if (totalQuestions === 0 || !currentQuestion) {
    // No es un error: la lectura existe, simplemente aún no tiene cuestionario.
    return (
      <EmptyState
        emoji="📝"
        title="Todavía no hay cuestionario"
        message="Tu docente aún no ha publicado preguntas para esta lectura. Puedes seguir leyendo mientras tanto."
        action={{ label: 'Volver a la lectura', onPress: leaveQuiz }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salir de la evaluación"
            accessibilityHint="Pedirá confirmación antes de descartar tus respuestas"
            hitSlop={12}
            style={styles.exitBtn}
            onPress={() => confirmExit(leaveQuiz)}
          >
            <Text style={styles.exitBtnText}>✕ Salir</Text>
          </Pressable>

          <Text style={styles.quizTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View
          style={styles.progressBarBg}
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: totalQuestions,
            now: currentIndex + 1,
            text: `Pregunta ${currentIndex + 1} de ${totalQuestions}`,
          }}
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.questionCounter}>
          Pregunta {currentIndex + 1} de {totalQuestions}
        </Text>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
        <View style={styles.column}>
          <View style={styles.questionCard}>
            <Text style={styles.questionPrompt} accessibilityRole="header">
              {currentQuestion.statement}
            </Text>
          </View>

          <Text style={styles.optionsHeader}>Selecciona una respuesta</Text>

          <View style={styles.optionsList} accessibilityRole="radiogroup">
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentAnswer === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Opción ${index + 1}: ${option.text}`}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(option.id)}
                >
                  <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                    {isSelected && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {Boolean(submitError) && (
            <View style={styles.submitErrorBanner} accessibilityRole="alert" accessible>
              <Text style={styles.submitErrorText}>
                No pudimos enviar tus respuestas. {toUserMessage(submitError)}
              </Text>
              <Text style={styles.submitErrorHint}>
                Tus respuestas siguen guardadas aquí; puedes reintentar el envío.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.footerRow}>
          {currentIndex > 0 && (
            <Button
              label="Anterior"
              variant="secondary"
              onPress={handlePrev}
              accessibilityLabel="Volver a la pregunta anterior"
              style={styles.prevBtn}
            />
          )}
          <Button
            label={
              submitError && isLastQuestion
                ? 'Reintentar envío'
                : isLastQuestion
                  ? 'Enviar Cuestionario'
                  : 'Siguiente Pregunta'
            }
            loading={isSubmitting}
            loadingLabel="Enviando…"
            disabled={!currentAnswer}
            haptic
            onPress={handleNext}
            accessibilityHint={
              !currentAnswer ? 'Selecciona una respuesta para continuar' : undefined
            }
            style={styles.nextBtn}
          />
        </View>
      </View>

      <CelebrationModal
        visible={resultVisible}
        result={result}
        onClose={handleCloseResult}
        onRetry={handleRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exitBtn: {
    minHeight: touchTarget.min,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  exitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandPrimary,
  },
  quizTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'right',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.bgSunken,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: borderRadius.full,
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  contentScroll: {
    flex: 1,
  },
  contentPadding: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  questionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionPrompt: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  optionsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.comfortable,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandBg,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: colors.brandPrimary,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandPrimary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: colors.brandFg,
    fontWeight: '700',
  },
  submitErrorBanner: {
    marginTop: spacing.xl,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerSolid,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  submitErrorText: {
    color: colors.dangerFg,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  submitErrorHint: {
    color: colors.dangerFg,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  prevBtn: {
    flexBasis: '32%',
  },
  nextBtn: {
    flex: 1,
  },
});
