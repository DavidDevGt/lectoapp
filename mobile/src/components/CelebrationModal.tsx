import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { QuizAttemptResult } from '../types/api';

interface CelebrationModalProps {
  visible: boolean;
  result: QuizAttemptResult | null;
  onClose: () => void;
  onRetry: () => void;
}

export function CelebrationModal({ visible, result, onClose, onRetry }: CelebrationModalProps) {
  if (!result) return null;

  const passed = result.passed;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.emojiHeader}>{passed ? '🎉🏆✨' : '💪📚'}</Text>

          <Text maxFontSizeMultiplier={1.3} style={styles.title}>
            {passed ? '¡Excelente trabajo!' : '¡Buen intento!'}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.subtitle}>
            {passed
              ? 'Has completado esta evaluación con éxito.'
              : 'Necesitas 70% o más para completar el nivel. ¡Vuelve a intentarlo!'}
          </Text>

          <View style={styles.scoreContainer}>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                styles.scoreValue,
                { color: passed ? colors.successSolid : colors.pendingSolid },
              ]}
            >
              {result.score}%
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.scoreDetail}>
              {result.correctAnswers} de {result.totalQuestions} respuestas correctas
            </Text>
          </View>

          <View style={styles.rewardsRow}>
            <View style={styles.rewardChip}>
              <Text style={styles.rewardIcon}>🪙</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.rewardText}>
                +{result.pointsEarned} Puntos
              </Text>
            </View>

            {passed && (
              <View style={styles.rewardChip}>
                <Text style={styles.rewardIcon}>🔥</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.rewardText}>
                  {result.streak} Racha
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {passed ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continuar a la ruta de aprendizaje"
                style={styles.primaryBtn}
                onPress={onClose}
              >
                <Text maxFontSizeMultiplier={1.3} style={styles.primaryBtnText}>
                  Continuar Ruta →
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar evaluación"
                  style={styles.primaryBtn}
                  onPress={onRetry}
                >
                  <Text maxFontSizeMultiplier={1.3} style={styles.primaryBtnText}>
                    Reintentar 🔄
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Volver al menú de lecturas"
                  style={styles.secondaryBtn}
                  onPress={onClose}
                >
                  <Text maxFontSizeMultiplier={1.3} style={styles.secondaryBtnText}>
                    Volver al menú
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: colors.bgDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emojiHeader: {
    fontSize: 42,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  scoreContainer: {
    backgroundColor: colors.bgSunken,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
  },
  scoreDetail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.goldFg,
  },
  actionButtons: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: colors.textOnBrand,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: colors.bgSunken,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
});
