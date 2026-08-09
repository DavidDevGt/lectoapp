import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';
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
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.emojiHeader}>{passed ? '🎉🏆✨' : '💪📚'}</Text>

          <Text maxFontSizeMultiplier={1.2} style={styles.title}>
            {passed ? '¡Excelente trabajo!' : '¡Buen intento!'}
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.subtitle}>
            {passed
              ? 'Has completado esta evaluación con éxito y alcanzado el puntaje requerido.'
              : 'Necesitas 70% o más para aprobar este reto. ¡Repasa la lectura e inténtalo de nuevo!'}
          </Text>

          <View style={styles.scoreContainer}>
            <Text
              maxFontSizeMultiplier={1.2}
              style={[
                styles.scoreValue,
                { color: passed ? colors.successSolid : colors.pendingSolid },
              ]}
            >
              {result.score}%
            </Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.scoreDetail}>
              {result.correctAnswers} de {result.totalQuestions} respuestas correctas
            </Text>
          </View>

          <View style={styles.rewardsRow}>
            <View style={styles.rewardChip}>
              <Text style={styles.rewardIcon}>🪙</Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.rewardText}>
                +{result.pointsEarned} Puntos
              </Text>
            </View>

            {passed && (
              <View style={[styles.rewardChip, styles.streakChip]}>
                <Text style={styles.rewardIcon}>🔥</Text>
                <Text maxFontSizeMultiplier={1.2} style={styles.streakText}>
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
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                onPress={onClose}
              >
                <Text maxFontSizeMultiplier={1.2} style={styles.primaryBtnText}>
                  Continuar Ruta →
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar evaluación"
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                  onPress={onRetry}
                >
                  <Text maxFontSizeMultiplier={1.2} style={styles.primaryBtnText}>
                    Reintentar 🔄
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Volver al menú de lecturas"
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                  onPress={onClose}
                >
                  <Text maxFontSizeMultiplier={1.2} style={styles.secondaryBtnText}>
                    Volver al Menú
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
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  emojiHeader: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  scoreContainer: {
    backgroundColor: colors.bgSunken,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '900',
  },
  scoreDetail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '700',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.goldSolid,
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
  streakChip: {
    backgroundColor: colors.streakBg,
    borderColor: colors.streakSolid,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.streakFg,
  },
  actionButtons: {
    width: '100%',
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    width: '100%',
    ...shadows.sm,
  },
  primaryBtnText: {
    color: colors.textOnBrand,
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: colors.bgSunken,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
