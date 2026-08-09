import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    Alert.alert(
      '¿Cerrar Sesión?',
      '¿Seguro que deseas salir de tu cuenta de estudiante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            logout();
            onLogout();
          },
        },
      ],
    );
  };

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const nextLevelPoints = 500;
  const levelProgress = Math.min(Math.round((user.totalPoints / nextLevelPoints) * 100), 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tarjeta de Perfil Hero */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text maxFontSizeMultiplier={1.2} style={styles.avatarText}>
            {initials}
          </Text>
        </View>

        <Text maxFontSizeMultiplier={1.2} style={styles.name}>
          {user.name}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.email}>
          {user.email}
        </Text>

        <View style={styles.badgeRow}>
          <Badge type="progression" level={user.currentLevel} />
        </View>

        {/* Progress Bar Hacia el Siguiente Nivel */}
        <View style={styles.levelProgressContainer}>
          <View style={styles.levelProgressHeader}>
            <Text maxFontSizeMultiplier={1.2} style={styles.levelProgressTitle}>
              Progreso de Nivel
            </Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.levelProgressValue}>
              {user.totalPoints} / {nextLevelPoints} pts
            </Text>
          </View>
          <View style={styles.levelBarBg}>
            <View style={[styles.levelBarFill, { width: `${levelProgress}%` }]} />
          </View>
        </View>
      </View>

      {/* Grid de Estadísticas Gamificadas */}
      <Text maxFontSizeMultiplier={1.2} style={styles.sectionTitle}>
        Tus Logros Educativos
      </Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.goldBg, borderColor: colors.goldSolid }]}>
          <Text style={styles.statEmoji}>🪙</Text>
          <Text maxFontSizeMultiplier={1.2} style={[styles.statValue, { color: colors.goldFg }]}>
            {user.totalPoints}
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.statLabel}>
            Puntos Totales
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.streakBg, borderColor: colors.streakSolid }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text maxFontSizeMultiplier={1.2} style={[styles.statValue, { color: colors.streakFg }]}>
            {user.streak} Días
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.statLabel}>
            Racha de Lectura
          </Text>
        </View>
      </View>

      {/* Desglose Pedagógico por Nivel de Comprensión */}
      <Text maxFontSizeMultiplier={1.2} style={styles.sectionTitle}>
        Niveles de Comprensión Lector
      </Text>

      <View style={styles.pedagogyCard}>
        <View style={styles.pedagogyItem}>
          <View style={styles.pedagogyRow}>
            <View style={styles.pedagogyMeta}>
              <Text maxFontSizeMultiplier={1.2} style={styles.pedagogyName}>
                🔍 Comprensión Literal
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.pedagogySub}>
                Identificación directa de hechos en el texto
              </Text>
            </View>
            <Text maxFontSizeMultiplier={1.2} style={[styles.pedagogyScore, { color: colors.literalFg }]}>
              85%
            </Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: '85%', backgroundColor: colors.literalSolid }]} />
          </View>
        </View>

        <View style={styles.pedagogyItem}>
          <View style={styles.pedagogyRow}>
            <View style={styles.pedagogyMeta}>
              <Text maxFontSizeMultiplier={1.2} style={styles.pedagogyName}>
                🧠 Comprensión Inferencial
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.pedagogySub}>
                Deducción de significados implícitos
              </Text>
            </View>
            <Text maxFontSizeMultiplier={1.2} style={[styles.pedagogyScore, { color: colors.inferentialFg }]}>
              70%
            </Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: '70%', backgroundColor: colors.inferentialSolid }]} />
          </View>
        </View>

        <View style={styles.pedagogyItem}>
          <View style={styles.pedagogyRow}>
            <View style={styles.pedagogyMeta}>
              <Text maxFontSizeMultiplier={1.2} style={styles.pedagogyName}>
                💡 Comprensión Crítica
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.pedagogySub}>
                Evaluación y opinión propia fundamentada
              </Text>
            </View>
            <Text maxFontSizeMultiplier={1.2} style={[styles.pedagogyScore, { color: colors.criticalFg }]}>
              60%
            </Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: '60%', backgroundColor: colors.criticalSolid }]} />
          </View>
        </View>
      </View>

      {/* Botón de Salir */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión de estudiante"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
        onPress={handleLogout}
      >
        <Text maxFontSizeMultiplier={1.2} style={styles.logoutBtnText}>
          Cerrar Sesión 🚪
        </Text>
      </Pressable>
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
    paddingBottom: spacing.xxxl * 2,
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
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontWeight: '500',
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
    marginBottom: spacing.xs + 2,
  },
  levelProgressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  levelProgressValue: {
    fontSize: 12,
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
    paddingLeft: 4,
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
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  pedagogyCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    gap: spacing.lg,
    ...shadows.sm,
  },
  pedagogyItem: {
    gap: spacing.xs + 2,
  },
  pedagogyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pedagogyMeta: {
    flex: 1,
  },
  pedagogyName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pedagogySub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pedagogyScore: {
    fontSize: 16,
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
  logoutBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dangerSolid,
  },
  logoutBtnPressed: {
    opacity: 0.85,
  },
  logoutBtnText: {
    color: colors.dangerFg,
    fontWeight: '800',
    fontSize: 15,
  },
});
