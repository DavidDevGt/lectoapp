import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { ReadingListItem, ComprehensionLevel } from '../types/api';
import { apiClient } from '../api/client';
import { ReadingCard } from '../components/ReadingCard';

interface LearningMapScreenProps {
  onSelectReading: (readingId: string) => void;
}

const COMPREHENSION_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'LITERAL', label: 'Literal' },
  { key: 'INFERENTIAL', label: 'Inferencial' },
  { key: 'CRITICAL', label: 'Crítico' },
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

  return (
    <View style={styles.container}>
      {/* Banner de ruta */}
      <View style={styles.banner}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>🗺️ Tu Ruta de Lectura</Text>
          <Text style={styles.bannerSubtitle}>
            Lee, responde cuestionarios y gana puntos para avanzar de nivel.
          </Text>
        </View>
      </View>

      {/* Filtros Pedagógicos */}
      <View style={styles.filterSection}>
        <Text style={styles.filterHeader}>Nivel de Comprensión:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {COMPREHENSION_FILTERS.map((f) => {
            const isActive = selectedCompFilter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCompFilter(f.key as ComprehensionLevel | 'ALL')}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Lecturas */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={styles.loadingText}>Cargando lecturas disponibles…</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No hay lecturas en este nivel</Text>
              <Text style={styles.emptySubtitle}>
                Selecciona otro nivel de comprensión para continuar aprendiendo.
              </Text>
            </View>
          ) : (
            readings.map((reading) => (
              <ReadingCard
                key={reading.id}
                reading={reading}
                onPress={() => onSelectReading(reading.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  banner: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  bannerTextContainer: {
    gap: 4,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textOnBrand,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#DBEAFE',
    lineHeight: 18,
    fontWeight: '500',
  },
  filterSection: {
    paddingVertical: 12,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bgSunken,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.brandPrimary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnBrand,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
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
  },
});
