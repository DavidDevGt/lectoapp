import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onProfilePress?: () => void;
}

export function Header({ onProfilePress }: HeaderProps) {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View style={styles.header}>
      <Pressable style={styles.userInfo} onPress={onProfilePress}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user ? getInitials(user.name) : 'ES'}</Text>
        </View>
        <View>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Estudiante'}
          </Text>
          <Text style={styles.userLevel}>Nivel {user?.currentLevel || 'Principiante'}</Text>
        </View>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={[styles.statChip, styles.pointsChip]}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={styles.pointsText}>{user?.totalPoints || 0}</Text>
        </View>

        <View style={[styles.statChip, styles.streakChip]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.streakText}>{user?.streak || 0}</Text>
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
    paddingTop: 12,
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
    backgroundColor: '#FEF3C7',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  streakChip: {
    backgroundColor: '#FEE2E2',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  statIcon: {
    fontSize: 13,
  },
});
