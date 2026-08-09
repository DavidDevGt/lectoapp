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
        <Text maxFontSizeMultiplier={1.3} style={styles.loadingText}>
          Cargando la lectura…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la ruta de aprendizaje"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          onPress={onBack}
        >
          <Text maxFontSizeMultiplier={1.3} style={styles.backBtnText}>
            ← Volver a la ruta
          </Text>
        </Pressable>
        <Badge type="comprehension" level={reading.comprehensionLevel} size="sm" />
      </View>

      {/* Main Content Scroll */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Title & Metadata */}
        <Text maxFontSizeMultiplier={1.3} style={styles.title}>
          {reading.title}
        </Text>

        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.metaText}>
              {reading.estimatedTimeMin} min de lectura
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>❓</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.metaText}>
              {reading.questions?.length || 4} preguntas de evaluación
            </Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.divider} />

        {/* Cuerpo del Texto */}
        <View style={styles.textContainer}>
          {reading.content.split('\n\n').map((paragraph, idx) => (
            <Text maxFontSizeMultiplier={1.3} key={idx} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comenzar cuestionario de evaluación para esta lectura"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.startQuizBtn, pressed && styles.startQuizBtnPressed]}
          onPress={() => onStartQuiz(reading)}
        >
          <Text maxFontSizeMultiplier={1.3} style={styles.startQuizBtnText}>
            Responder Cuestionario ✨
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
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 32,
    marginBottom: 12,
  },
  metaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  textContainer: {
    gap: 16,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 28,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
    shadowColor: colors.bgDark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  startQuizBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startQuizBtnPressed: {
    backgroundColor: colors.brandHover,
  },
  startQuizBtnText: {
    color: colors.textOnBrand,
    fontWeight: '900',
    fontSize: 16,
  },
});
