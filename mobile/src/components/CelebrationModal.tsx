import React, { useEffect } from 'react';
import { AccessibilityInfo, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, layout, shadows, spacing } from '../theme/colors';
import { ProgressionLevel, SubmitProgressResult } from '../types/api';
import { progressionLabel } from './Badge';
import { Button } from './ui/Button';

interface CelebrationModalProps {
  visible: boolean;
  result: SubmitProgressResult | null;
  onClose: () => void;
  onRetry: () => void;
}

export function CelebrationModal({ visible, result, onClose, onRetry }: CelebrationModalProps) {
  const passed = result?.attempt.passed ?? false;
  const percentage = result ? Math.round(result.attempt.percentage) : 0;

  useEffect(() => {
    if (!visible || !result) return;
    AccessibilityInfo.announceForAccessibility(
      passed
        ? `Aprobaste con ${percentage} por ciento.`
        : `Obtuviste ${percentage} por ciento. Necesitas 70 por ciento para aprobar.`,
    );
  }, [visible, result, passed, percentage]);

  if (!result) return null;

  const { attempt, progress, rewards } = result;
  // El backend solo premia la primera aprobación; decirlo evita que el estudiante
  // crea que el reintento le sumó puntos.
  const earnedPoints = rewards.pointsEarned > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard} accessibilityViewIsModal accessible={false}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.emojiHeader} importantForAccessibility="no" accessibilityElementsHidden>
              {passed ? '🎉' : '💪'}
            </Text>

            <Text style={styles.title} accessibilityRole="header">
              {passed ? '¡Excelente trabajo!' : '¡Buen intento!'}
            </Text>
            <Text style={styles.subtitle}>
              {passed
                ? 'Completaste esta evaluación y alcanzaste el puntaje requerido.'
                : 'Necesitas 70% o más para aprobar este reto. Repasa la lectura e inténtalo otra vez.'}
            </Text>

            <View style={styles.scoreContainer}>
              <Text
                style={[
                  styles.scoreValue,
                  { color: passed ? colors.successFg : colors.pendingFg },
                ]}
              >
                {percentage}%
              </Text>
              <Text style={styles.scoreDetail}>
                {attempt.score} de {attempt.totalQuestions} respuestas correctas
              </Text>
            </View>

            <View style={styles.rewardsColumn}>
              {earnedPoints ? (
                <View style={styles.rewardChip}>
                  <Text style={styles.rewardText}>
                    +{rewards.pointsEarned} puntos · {rewards.totalPoints} en total
                  </Text>
                </View>
              ) : (
                <Text style={styles.noRewardText}>
                  {progress.completed
                    ? 'Ya habías aprobado esta lectura, así que no suma puntos nuevos.'
                    : 'Aprueba con 70% o más para ganar puntos.'}
                </Text>
              )}

              {rewards.levelUp && rewards.newLevel && (
                <View style={[styles.rewardChip, styles.levelUpChip]}>
                  <Text style={styles.levelUpText}>
                    ¡Subiste a nivel {progressionLabel(rewards.newLevel as ProgressionLevel)}!
                  </Text>
                </View>
              )}

              <Text style={styles.attemptsText}>
                Mejor puntaje: {Math.round(progress.bestScore)}% · Intento {progress.attempts}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {passed ? (
                <Button label="Continuar mi ruta" onPress={onClose} haptic />
              ) : (
                <>
                  <Button label="Reintentar cuestionario" onPress={onRetry} haptic />
                  <Button label="Volver a la ruta" variant="secondary" onPress={onClose} />
                </>
              )}
            </View>
          </ScrollView>
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
    width: '100%',
    maxWidth: layout.maxContentWidth,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  scrollContent: {
    padding: spacing.xxl,
    alignItems: 'center',
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
    marginBottom: spacing.xs + 2,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
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
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  rewardsColumn: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  rewardChip: {
    backgroundColor: colors.goldBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.goldSolid,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.goldFg,
    textAlign: 'center',
  },
  noRewardText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  levelUpChip: {
    backgroundColor: colors.successBg,
    borderColor: colors.successSolid,
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.successFg,
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButtons: {
    width: '100%',
    gap: spacing.md,
  },
});
