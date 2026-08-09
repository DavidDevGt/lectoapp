import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';
import { ReadingListItem, ComprehensionLevel } from '../types/api';
import { apiClient } from '../api/client';
import { ReadingCard } from '../components/ReadingCard';

interface LearningMapScreenProps {
  onSelectReading: (readingId: string) => void;
}

const COMPREHENSION_FILTERS: { key: string; label: string; icon: string }[] = [
  { key: 'ALL', label: 'Todas las Lecturas', icon: '🌟' },
  { key: 'LITERAL', label: 'Comprensión Literal', icon: '🔍' },
  { key: 'INFERENTIAL', label: 'Comprensión Inferencial', icon: '🧠' },
  { key: 'CRITICAL', label: 'Comprensión Crítica', icon: '💡' },
];

export function LearningMapScreen({ onSelectReading }: LearningMapScreenProps) {
  const [selectedCompFilter, setSelectedCompFilter] = useState<string>('ALL');
  const [readings, setReadings] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReadings();
  }, [selectedCompFilter]);

  const loadReadings = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getReadings(
        selectedCompFilter === 'ALL' ? undefined : selectedCompFilter,
      );
      setReadings(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Banner de ruta principal */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerContent}>
          <Text maxFontSizeMultiplier={1.2} style={styles.bannerTitle}>
            🗺️ Tu Ruta de Lectura
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.bannerSubtitle}>
            Supera cada reto de comprensión, acumula puntos 🪙 y eleva tu nivel.
          </Text>
        </View>
      </View>

      {/* Filtros Pedagógicos */}
      <View style={styles.filterContainer}>
        <Text maxFontSizeMultiplier={1.2} style={styles.filterSectionTitle}>
          Nivel de Comprensión Lector
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {COMPREHENSION_FILTERS.map((f) => {
            const isActive = selectedCompFilter === f.key;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Filtro ${f.label}`}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCompFilter(f.key as ComprehensionLevel | 'ALL')}
              >
                <Text style={styles.filterChipIcon}>{f.icon}</Text>
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          {renderHeader()}
          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text maxFontSizeMultiplier={1.2} style={styles.loadingText}>
              Cargando tus lecturas disponibles…
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          renderItem={({ item }) => (
            <ReadingCard reading={item} onPress={() => onSelectReading(item.id)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖✨</Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.emptyTitle}>
                No hay lecturas en este nivel
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.emptySubtitle}>
                Selecciona otro nivel de comprensión para continuar tu camino de aprendizaje.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  headerWrapper: {
    marginBottom: spacing.md,
  },
  bannerCard: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  bannerContent: {
    gap: 4,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textOnBrand,
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.brandLightText,
    lineHeight: 19,
    fontWeight: '500',
  },
  filterContainer: {
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filtersScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandHover,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnBrand,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    marginTop: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
