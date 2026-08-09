import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onProfilePress?: () => void;
}

export function Header({ onProfilePress }: HeaderProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 12,
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${user?.name || 'Estudiante'}, Nivel ${user?.currentLevel || 'Principiante'}`}
        accessibilityHint="Abre la pantalla de perfil y logros"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.userInfo}
        onPress={onProfilePress}
      >
        <View style={styles.avatar}>
          <Text maxFontSizeMultiplier={1.3} style={styles.avatarText}>
            {user ? getInitials(user.name) : 'ES'}
          </Text>
        </View>
        <View>
          <Text maxFontSizeMultiplier={1.3} style={styles.userName} numberOfLines={1}>
            {user?.name || 'Estudiante'}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.userLevel}>
            Nivel {user?.currentLevel || 'Principiante'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.statsRow}>
        <View
          accessibilityLabel={`${user?.totalPoints || 0} Puntos acumulados`}
          style={[styles.statChip, styles.pointsChip]}
        >
          <Text style={styles.statIcon}>🪙</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.pointsText}>
            {user?.totalPoints || 0}
          </Text>
        </View>

        <View
          accessibilityLabel={`${user?.streak || 0} días de racha de lectura`}
          style={[styles.statChip, styles.streakChip]}
        >
          <Text style={styles.statIcon}>🔥</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.streakText}>
            {user?.streak || 0}
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  pointsChip: {
    backgroundColor: colors.goldBg,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.goldFg,
  },
  streakChip: {
    backgroundColor: colors.streakBg,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.streakFg,
  },
  statIcon: {
    fontSize: 13,
  },
});
