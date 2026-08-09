import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Targeta de Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user.name
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')}
          </Text>
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.badgeRow}>
          <Badge type="progression" level={user.currentLevel} />
        </View>
      </View>

      {/* Gamificación Stats Grid */}
      <Text style={styles.sectionTitle}>Tus Logros Educativos</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.statEmoji}>🪙</Text>
          <Text style={[styles.statValue, { color: '#B45309' }]}>{user.totalPoints}</Text>
          <Text style={styles.statLabel}>Puntos Totales</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{user.streak} Días</Text>
          <Text style={styles.statLabel}>Racha Actual</Text>
        </View>
      </View>

      {/* Avance por Nivel Pedagógico */}
      <Text style={styles.sectionTitle}>Comprensión Lectora</Text>

      <View style={styles.pedagogyCard}>
        <View style={styles.pedagogyRow}>
          <View style={styles.pedagogyMeta}>
            <Text style={styles.pedagogyName}>Literal</Text>
            <Text style={styles.pedagogySub}>Lectura directa del texto</Text>
          </View>
          <Text style={[styles.pedagogyScore, { color: colors.literalFg }]}>85%</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: '85%', backgroundColor: colors.literalSolid }]} />
        </View>

        <View style={[styles.pedagogyRow, { marginTop: 14 }]}>
          <View style={styles.pedagogyMeta}>
            <Text style={styles.pedagogyName}>Inferencial</Text>
            <Text style={styles.pedagogySub}>Deducción de información implícita</Text>
          </View>
          <Text style={[styles.pedagogyScore, { color: colors.inferentialFg }]}>70%</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: '70%', backgroundColor: colors.inferentialSolid }]} />
        </View>

        <View style={[styles.pedagogyRow, { marginTop: 14 }]}>
          <View style={styles.pedagogyMeta}>
            <Text style={styles.pedagogyName}>Crítico</Text>
            <Text style={styles.pedagogySub}>Evaluación y juicio propio</Text>
          </View>
          <Text style={[styles.pedagogyScore, { color: colors.criticalFg }]}>60%</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: '60%', backgroundColor: colors.criticalSolid }]} />
        </View>
      </View>

      {/* Botón de Salir */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Cerrar Sesión 🚪</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.textOnBrand,
    fontSize: 26,
    fontWeight: '900',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  badgeRow: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },
  pedagogyCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  pedagogyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pedagogyMeta: {
    flex: 1,
  },
  pedagogyName: {
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  logoutBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: colors.dangerFg,
    fontWeight: '800',
    fontSize: 15,
  },
});
