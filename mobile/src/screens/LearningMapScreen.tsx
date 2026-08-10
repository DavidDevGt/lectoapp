import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { borderRadius, colors, layout, spacing, touchTarget } from '../theme/colors';
import { ReadingListItem } from '../types/api';
import { apiClient } from '../api/client';
import { isAborted } from '../api/errors';
import { ReadingCard } from '../components/ReadingCard';
import { ErrorState, EmptyState, LoadingState } from '../components/ui/ScreenState';
import type { RootStackParamList, TabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Ruta'>,
  NativeStackScreenProps<RootStackParamList>
>;

const COMPREHENSION_FILTERS = [
  { key: 'ALL', label: 'Todas las Lecturas', icon: '🌟' },
  { key: 'LITERAL', label: 'Comprensión Literal', icon: '🔍' },
  { key: 'INFERENTIAL', label: 'Comprensión Inferencial', icon: '🧠' },
  { key: 'CRITICAL', label: 'Comprensión Crítica', icon: '💡' },
] as const;

const PAGE_SIZE = 20;

export function LearningMapScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<string>('ALL');
  const [readings, setReadings] = useState<ReadingListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  // Solo la petición más reciente puede escribir en el estado: tocar filtros rápido
  // ya no deja que una respuesta lenta pise a una posterior.
  const runIdRef = useRef(0);

  const load = useCallback(
    async (targetPage: number, mode: 'load' | 'refresh' | 'more') => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const runId = ++runIdRef.current;

      if (mode === 'refresh') setIsRefreshing(true);
      else if (mode === 'more') setIsLoadingMore(true);
      else setIsLoading(true);

      try {
        const result = await apiClient.getReadings({
          comprehensionLevel: filter,
          page: targetPage,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        if (runId !== runIdRef.current) return;

        setReadings((prev) => (mode === 'more' ? [...prev, ...result.items] : result.items));
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
        setError(null);
      } catch (caught) {
        if (runId !== runIdRef.current || isAborted(caught) || controller.signal.aborted) return;
        setError(caught);
      } finally {
        if (runId === runIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [filter],
  );

  useEffect(() => {
    void load(1, 'load');
    return () => controllerRef.current?.abort();
  }, [load]);

  const handleEndReached = useCallback(() => {
    if (isLoading || isLoadingMore || isRefreshing) return;
    if (page >= totalPages) return;
    void load(page + 1, 'more');
  }, [isLoading, isLoadingMore, isRefreshing, page, totalPages, load]);

  const renderItem = useCallback(
    ({ item }: { item: ReadingListItem }) => (
      <ReadingCard
        reading={item}
        onPress={() => navigation.navigate('Reader', { readingId: item.id })}
      />
    ),
    [navigation],
  );

  const activeFilterLabel =
    COMPREHENSION_FILTERS.find((f) => f.key === filter)?.label ?? 'este nivel';

  return (
    <View style={styles.container}>
      {/* Banner y filtros quedan fijos: siempre accesibles y, al no vivir dentro de
          ListHeaderComponent, la fila de filtros ya no se remonta ni pierde su scroll. */}
      <View style={styles.bannerCard}>
        <Text style={styles.bannerTitle} accessibilityRole="header">
          Tu Ruta de Lectura
        </Text>
        <Text style={styles.bannerSubtitle}>
          Supera cada reto de comprensión, acumula puntos y eleva tu nivel.
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterSectionTitle}>Nivel de Comprensión Lector</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {COMPREHENSION_FILTERS.map((item) => {
            const isActive = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={item.label}
                hitSlop={8}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text
                  style={styles.filterChipIcon}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                >
                  {item.icon}
                </Text>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingState label="Cargando tus lecturas…" />
      ) : error && readings.length === 0 ? (
        <ErrorState error={error} onRetry={() => void load(1, 'load')} />
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load(1, 'refresh')}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                style={styles.footerSpinner}
                color={colors.brandPrimary}
                accessibilityLabel="Cargando más lecturas"
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📖"
              title={
                filter === 'ALL'
                  ? 'Todavía no hay lecturas publicadas'
                  : `No hay lecturas de ${activeFilterLabel.toLowerCase()}`
              }
              message={
                filter === 'ALL'
                  ? 'Tu docente aún no ha publicado lecturas. Vuelve a intentarlo más tarde.'
                  : 'Prueba con otro nivel de comprensión para seguir tu camino de aprendizaje.'
              }
              action={
                filter === 'ALL'
                  ? { label: 'Actualizar', onPress: () => void load(1, 'load') }
                  : { label: 'Ver todas las lecturas', onPress: () => setFilter('ALL') }
              }
            />
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
  bannerCard: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textOnBrand,
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.textOnBrandMuted,
    lineHeight: 20,
    fontWeight: '500',
  },
  filterContainer: {
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: 12,
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
    justifyContent: 'center',
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs + 2,
  },
  filterChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandHover,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnBrand,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxWidth: layout.maxReadingWidth,
    width: '100%',
    alignSelf: 'center',
  },
  footerSpinner: {
    paddingVertical: spacing.xl,
  },
});
