import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';
import { ReadingDetail } from '../types/api';
import { apiClient } from '../api/client';
import { Badge } from '../components/Badge';

interface ReaderScreenProps {
  readingId: string;
  onBack: () => void;
  onStartQuiz: (reading: ReadingDetail) => void;
}

export function ReaderScreen({ readingId, onBack, onStartQuiz }: ReaderScreenProps) {
  const [reading, setReading] = useState<ReadingDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1); // 1 = Normal, 1.15 = Grande, 1.3 = Extra

  useEffect(() => {
    loadDetail();
  }, [readingId]);

  const loadDetail = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getReadingById(readingId);
      setReading(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !reading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text maxFontSizeMultiplier={1.2} style={styles.loadingText}>
          Cargando la lectura…
        </Text>
      </View>
    );
  }

  const baseFontSize = 17 * fontSizeMultiplier;
  const baseLineHeight = 28 * fontSizeMultiplier;

  return (
    <View style={styles.container}>
      {/* Barra Superior de Navegación y Controles de Lectura */}
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la ruta de aprendizaje"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          onPress={onBack}
        >
          <Text maxFontSizeMultiplier={1.2} style={styles.backBtnText}>
            ← Volver a la Ruta
          </Text>
        </Pressable>

        <View style={styles.navRightGroup}>
          {/* Toggle de Tamaño de Fuente */}
          <View style={styles.fontToggleGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tamaño de letra normal"
              style={[styles.fontBtn, fontSizeMultiplier === 1 && styles.fontBtnActive]}
              onPress={() => setFontSizeMultiplier(1)}
            >
              <Text style={[styles.fontBtnText, fontSizeMultiplier === 1 && styles.fontBtnTextActive]}>
                A
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tamaño de letra grande"
              style={[styles.fontBtn, fontSizeMultiplier === 1.15 && styles.fontBtnActive]}
              onPress={() => setFontSizeMultiplier(1.15)}
            >
              <Text style={[styles.fontBtnText, { fontSize: 14 }, fontSizeMultiplier === 1.15 && styles.fontBtnTextActive]}>
                A+
              </Text>
            </Pressable>
          </View>

          <Badge type="comprehension" level={reading.comprehensionLevel} size="sm" />
        </View>
      </View>

      {/* Área de Lectura */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Título y Metadatos */}
        <Text maxFontSizeMultiplier={1.2} style={styles.title}>
          {reading.title}
        </Text>

        <View style={styles.metaBar}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.metaText}>
              {reading.estimatedTimeMin} min de lectura
            </Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaIcon}>📝</Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.metaText}>
              {reading.questions?.length || 4} preguntas
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Párrafos del texto */}
        <View style={styles.textContainer}>
          {reading.content.split('\n\n').map((paragraph, idx) => (
            <Text
              maxFontSizeMultiplier={1.3}
              key={idx}
              style={[
                styles.paragraph,
                { fontSize: baseFontSize, lineHeight: baseLineHeight },
              ]}
            >
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* Barra Inferior Sticky con Acción Principal */}
      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comenzar cuestionario de evaluación para esta lectura"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.startQuizBtn, pressed && styles.startQuizBtnPressed]}
          onPress={() => onStartQuiz(reading)}
        >
          <Text maxFontSizeMultiplier={1.2} style={styles.startQuizBtnText}>
            Comenzar Cuestionario ✨
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandPrimary,
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fontToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.bgSunken,
    borderRadius: borderRadius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  fontBtnActive: {
    backgroundColor: colors.bgSurface,
    ...shadows.sm,
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  fontBtnTextActive: {
    color: colors.brandPrimary,
    fontWeight: '900',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  metaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSunken,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  textContainer: {
    gap: spacing.xl,
  },
  paragraph: {
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  bottomBar: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
    ...shadows.lg,
  },
  startQuizBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  startQuizBtnPressed: {
    backgroundColor: colors.brandHover,
  },
  startQuizBtnText: {
    color: colors.textOnBrand,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
