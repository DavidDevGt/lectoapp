import React, { useCallback, useEffect } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { borderRadius, colors, layout, shadows, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { useAsyncData } from '../hooks/useAsyncData';
import { Badge } from '../components/Badge';
import { Button } from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/ScreenState';
import { ComprehensionLevel, LevelBreakdown } from '../types/api';

const COMPREHENSION_SECTIONS: {
  key: ComprehensionLevel;
  name: string;
  description: string;
  color: string;
  textColor: string;
}[] = [
  {
    key: 'LITERAL',
    name: 'Comprensión Literal',
    description: 'Identificación directa de hechos en el texto',
    color: colors.literalSolid,
    textColor: colors.literalFg,
  },
  {
    key: 'INFERENTIAL',
    name: 'Comprensión Inferencial',
    description: 'Deducción de significados implícitos',
    color: colors.inferentialSolid,
    textColor: colors.inferentialFg,
  },
  {
    key: 'CRITICAL',
    name: 'Comprensión Crítica',
    description: 'Evaluación y opinión propia fundamentada',
    color: colors.criticalSolid,
    textColor: colors.criticalFg,
  },
];

export function ProfileScreen() {
  const { user, logout, applyServerTotals } = useAuth();
  const insets = useSafeAreaInsets();

  const fetcher = useCallback((signal: AbortSignal) => apiClient.getMyProgress(signal), []);
  const { data: progress, error, isLoading, isRefreshing, reload, refresh } = useAsyncData(
    fetcher,
    [],
  );

  // Al volver de un cuestionario los totales cambiaron: recargamos en segundo plano
  // en vez de mostrar cifras viejas.
  const isFirstFocus = React.useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  // La cabecera comparte estos totales; sin esto la racha se quedaba congelada.
  useEffect(() => {
    if (!progress) return;
    applyServerTotals({
      totalPoints: progress.totalPoints,
      streak: progress.streak,
      currentLevel: progress.currentLevel,
    });
  }, [progress, applyServerTotals]);

  const handleLogout = () => {
    Alert.alert('¿Cerrar sesión?', 'Tendrás que ingresar tu correo y contraseña otra vez.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (isLoading) {
    return <LoadingState label="Cargando tu progreso…" />;
  }

  if (error || !progress) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const { overall } = progress;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xxl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={colors.brandPrimary}
          colors={[colors.brandPrimary]}
        />
      }
    >
      <View style={styles.column}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge} importantForAccessibility="no-hide-descendants">
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name} accessibilityRole="header">
            {user.name}
          </Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.badgeRow}>
            <Badge type="progression" level={progress.currentLevel} />
          </View>

          <View
            style={styles.levelProgressContainer}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Lecturas completadas: ${overall.completedReadings} de ${overall.totalReadings}`}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(overall.overallPercentage) }}
          >
            <View style={styles.levelProgressHeader}>
              <Text style={styles.levelProgressTitle}>Lecturas completadas</Text>
              <Text style={styles.levelProgressValue}>
                {overall.completedReadings} / {overall.totalReadings}
              </Text>
            </View>
            <View style={styles.levelBarBg}>
              <View
                style={[
                  styles.levelBarFill,
                  { width: `${Math.min(100, Math.max(0, overall.overallPercentage))}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Tus logros
        </Text>

        <View style={styles.statsGrid}>
          <View
            style={[styles.statBox, { backgroundColor: colors.goldBg, borderColor: colors.goldSolid }]}
            accessible
            accessibilityLabel={`${progress.totalPoints} puntos totales`}
          >
            <Text style={styles.statEmoji} importantForAccessibility="no" accessibilityElementsHidden>
              🪙
            </Text>
            <Text style={[styles.statValue, { color: colors.goldFg }]}>{progress.totalPoints}</Text>
            <Text style={styles.statLabel}>Puntos totales</Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.streakBg, borderColor: colors.streakSolid },
            ]}
            accessible
            accessibilityLabel={`Racha de lectura: ${progress.streak} días`}
          >
            <Text style={styles.statEmoji} importantForAccessibility="no" accessibilityElementsHidden>
              🔥
            </Text>
            <Text style={[styles.statValue, { color: colors.streakFg }]}>
              {progress.streak} {progress.streak === 1 ? 'día' : 'días'}
            </Text>
            <Text style={styles.statLabel}>Racha de lectura</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Niveles de comprensión lectora
        </Text>

        <View style={styles.pedagogyCard}>
          {COMPREHENSION_SECTIONS.map((section) => {
            const breakdown: LevelBreakdown = progress.byComprehensionLevel[section.key] ?? {
              total: 0,
              completed: 0,
              percentage: 0,
            };
            const hasContent = breakdown.total > 0;
            const percentage = Math.round(breakdown.percentage);

            return (
              <View
                key={section.key}
                style={styles.pedagogyItem}
                accessible
                accessibilityLabel={
                  hasContent
                    ? `${section.name}: ${breakdown.completed} de ${breakdown.total} lecturas completadas, ${percentage} por ciento`
                    : `${section.name}: todavía no hay lecturas de este nivel`
                }
              >
                <View style={styles.pedagogyRow}>
                  <View style={styles.pedagogyMeta}>
                    <Text style={styles.pedagogyName}>{section.name}</Text>
                    <Text style={styles.pedagogySub}>{section.description}</Text>
                  </View>
                  <Text style={[styles.pedagogyScore, { color: section.textColor }]}>
                    {hasContent ? `${percentage}%` : '—'}
                  </Text>
                </View>

                {hasContent ? (
                  <>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${percentage}%`, backgroundColor: section.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.pedagogyCount}>
                      {breakdown.completed} de {breakdown.total} lecturas
                    </Text>
                  </>
                ) : (
                  <Text style={styles.pedagogyCount}>
                    Aún no hay lecturas publicadas en este nivel.
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <Button
          label="Cerrar sesión"
          variant="danger"
          onPress={handleLogout}
          accessibilityHint="Pedirá confirmación antes de salir de tu cuenta"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  profileCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarText: {
    color: colors.textOnBrand,
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeRow: {
    marginBottom: spacing.lg,
  },
  levelProgressContainer: {
    width: '100%',
    backgroundColor: colors.bgSunken,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  levelProgressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  levelProgressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandPrimary,
  },
  levelBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: colors.brandPrimary,
    borderRadius: borderRadius.full,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  pedagogyCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    gap: spacing.xl,
    ...shadows.sm,
  },
  pedagogyItem: {
    gap: spacing.xs + 2,
  },
  pedagogyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pedagogyMeta: {
    flex: 1,
  },
  pedagogyName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pedagogySub: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  pedagogyScore: {
    fontSize: 17,
    fontWeight: '900',
  },
  barBg: {
    height: 8,
    backgroundColor: colors.bgSunken,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  pedagogyCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
