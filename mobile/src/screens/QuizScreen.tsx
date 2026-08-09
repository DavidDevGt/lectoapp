import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  BackHandler,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { QuizAttemptResult, ReadingDetail } from '../types/api';
import { apiClient } from '../api/client';
import { CelebrationModal } from '../components/CelebrationModal';
import { useAuth } from '../context/AuthContext';

interface QuizScreenProps {
  reading: ReadingDetail;
  onBackToReader: () => void;
  onFinishQuiz: () => void;
}

export function QuizScreen({ reading, onBackToReader, onFinishQuiz }: QuizScreenProps) {
  const { addPoints } = useAuth();
  const questions = reading.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [resultModalVisible, setResultModalVisible] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);

  // Interceptar botón de retroceso físico de Android durante la evaluación
  useEffect(() => {
    const onBackPress = () => {
      if (resultModalVisible) {
        setResultModalVisible(false);
        onFinishQuiz();
        return true;
      }

      Alert.alert(
        '¿Salir de la evaluación?',
        'Si sales ahora, perderás el progreso de esta evaluación.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => {} },
          { text: 'Salir', style: 'destructive', onPress: onBackToReader },
        ],
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [resultModalVisible, onBackToReader, onFinishQuiz]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleNext = async () => {
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Enviar evaluación
      setIsSubmitting(true);
      try {
        const res = await apiClient.submitQuiz(reading.id, userAnswers);
        setQuizResult(res);
        if (res.passed) {
          addPoints(res.pointsEarned, res.streak);
        }
        setResultModalVisible(true);
      } catch {
        // fallback
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      Alert.alert(
        '¿Salir de la evaluación?',
        'Si sales ahora, perderás el progreso de esta evaluación.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => {} },
          { text: 'Salir', style: 'destructive', onPress: onBackToReader },
        ],
      );
    }
  };

  const handleRetry = () => {
    setResultModalVisible(false);
    setUserAnswers({});
    setCurrentIndex(0);
  };

  const handleModalClose = () => {
    setResultModalVisible(false);
    onFinishQuiz();
  };

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text maxFontSizeMultiplier={1.3} style={styles.emptyText}>
          Esta lectura aún no tiene preguntas disponibles.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la lectura"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
          onPress={onBackToReader}
        >
          <Text maxFontSizeMultiplier={1.3} style={styles.backBtnText}>
            Volver a la lectura
          </Text>
        </Pressable>
      </View>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <View style={styles.container}>
      {/* Header & Barra de Progreso */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pregunta anterior o salir"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBackBtn}
            onPress={handlePrev}
          >
            <Text maxFontSizeMultiplier={1.3} style={styles.headerBackText}>
              ← Anterior
            </Text>
          </Pressable>
          <Text maxFontSizeMultiplier={1.3} style={styles.questionCounter}>
            Pregunta {currentIndex + 1} de {totalQuestions}
          </Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Pregunta & Opciones */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
        <View style={styles.questionCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.questionPrompt}>
            {currentQuestion.prompt}
          </Text>
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.optionsHeader}>
          Selecciona una respuesta:
        </Text>

        <View style={styles.optionsList} accessibilityRole="radiogroup">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentAnswer === option;
            return (
              <Pressable
                key={idx}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Opción ${idx + 1}: ${option}`}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelectOption(option)}
              >
                <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                  {isSelected && <View style={styles.optionRadioInner} />}
                </View>
                <Text
                  maxFontSizeMultiplier={1.3}
                  style={[styles.optionText, isSelected && styles.optionTextSelected]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Sticky Footer */}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isLastQuestion ? 'Enviar cuestionario de evaluación' : 'Avanzar a la siguiente pregunta'
          }
          accessibilityState={{ disabled: !currentAnswer || isSubmitting }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.nextBtn, (!currentAnswer || isSubmitting) && styles.nextBtnDisabled]}
          disabled={!currentAnswer || isSubmitting}
          onPress={handleNext}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textOnBrand} />
          ) : (
            <Text maxFontSizeMultiplier={1.3} style={styles.nextBtnText}>
              {isLastQuestion ? 'Enviar Cuestionario 🏆' : 'Siguiente Pregunta →'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Modal de Resultados */}
      <CelebrationModal
        visible={resultModalVisible}
        result={quizResult}
        onClose={handleModalClose}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: colors.textOnBrand,
    fontWeight: '700',
  },
  header: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBackBtn: {
    paddingVertical: 4,
  },
  headerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.bgSunken,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: 4,
  },
  contentScroll: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 10,
    paddingLeft: 4,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandBg,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  optionTextSelected: {
    color: colors.brandFg,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    color: colors.textOnBrand,
    fontWeight: '900',
    fontSize: 16,
  },
});
