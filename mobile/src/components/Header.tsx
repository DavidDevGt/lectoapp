import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

/**
 * Cabecera gamificada de las pestañas.
 *
 * Es informativa, no navegable: el perfil tiene su propia pestaña. Antes era un
 * botón que saltaba a Perfil y, si el estudiante lo tocaba durante un cuestionario,
 * descartaba sus respuestas sin avisar.
 */
export function Header() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const initials = user
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'ES';

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.userInfo} accessible accessibilityRole="header">
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {/* minWidth 0 permite que numberOfLines recorte en vez de empujar las fichas. */}
        <View style={styles.userText}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {user?.name ?? 'Estudiante'}
          </Text>
          <Text style={styles.userLevel} numberOfLines={1}>
            Nivel {user?.currentLevel ?? 'Principiante'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View
          accessible
          accessibilityLabel={`${user?.totalPoints ?? 0} puntos acumulados`}
          style={[styles.statChip, styles.pointsChip]}
        >
          <Text style={styles.statIcon} importantForAccessibility="no" accessibilityElementsHidden>
            🪙
          </Text>
          <Text style={styles.pointsText} numberOfLines={1}>
            {user?.totalPoints ?? 0}
          </Text>
        </View>

        <View
          accessible
          accessibilityLabel={`Racha de ${user?.streak ?? 0} días de lectura`}
          style={[styles.statChip, styles.streakChip]}
        >
          <Text style={styles.statIcon} importantForAccessibility="no" accessibilityElementsHidden>
            🔥
          </Text>
          <Text style={styles.streakText} numberOfLines={1}>
            {user?.streak ?? 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
    minWidth: 0,
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnBrand,
    fontWeight: '800',
    fontSize: 15,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userLevel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  pointsChip: {
    backgroundColor: colors.goldBg,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.goldFg,
  },
  streakChip: {
    backgroundColor: colors.streakBg,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.streakFg,
  },
  statIcon: {
    fontSize: 14,
  },
});
