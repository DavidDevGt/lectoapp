import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Header } from './src/components/Header';
import { LoginScreen } from './src/screens/LoginScreen';
import { LearningMapScreen } from './src/screens/LearningMapScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReadingDetail } from './src/types/api';
import { colors } from './src/theme/colors';

type ScreenView =
  | { type: 'LOGIN' }
  | { type: 'MAP' }
  | { type: 'READER'; readingId: string }
  | { type: 'QUIZ'; reading: ReadingDetail }
  | { type: 'PROFILE' };

function MainApp() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<ScreenView>(
    user ? { type: 'MAP' } : { type: 'LOGIN' },
  );

  // Si no hay usuario en sesión, mostrar pantalla de Login
  if (!user || currentView.type === 'LOGIN') {
    return (
      <LoginScreen
        onLoginSuccess={() => setCurrentView({ type: 'MAP' })}
      />
    );
  }

  const activeTab = currentView.type === 'PROFILE' ? 'PROFILE' : 'MAP';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header Gamificado (Puntos, Racha, Avatar con Insets Seguros) */}
      <Header onProfilePress={() => setCurrentView({ type: 'PROFILE' })} />

      {/* Cuerpo Principal */}
      <View style={styles.body}>
        {currentView.type === 'MAP' && (
          <LearningMapScreen
            onSelectReading={(readingId) =>
              setCurrentView({ type: 'READER', readingId })
            }
          />
        )}

        {currentView.type === 'READER' && (
          <ReaderScreen
            readingId={currentView.readingId}
            onBack={() => setCurrentView({ type: 'MAP' })}
            onStartQuiz={(reading) =>
              setCurrentView({ type: 'QUIZ', reading })
            }
          />
        )}

        {currentView.type === 'QUIZ' && (
          <QuizScreen
            reading={currentView.reading}
            onBackToReader={() =>
              setCurrentView({
                type: 'READER',
                readingId: currentView.reading.id,
              })
            }
            onFinishQuiz={() => setCurrentView({ type: 'MAP' })}
          />
        )}

        {currentView.type === 'PROFILE' && (
          <ProfileScreen
            onLogout={() => setCurrentView({ type: 'LOGIN' })}
          />
        )}
      </View>

      {/* Bottom Tab Bar (Navegación Móvil con Accesibilidad e Insets Inferiores) */}
      {currentView.type !== 'QUIZ' && currentView.type !== 'READER' && (
        <View
          style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
          accessibilityRole="tablist"
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'MAP' }}
            accessibilityLabel="Pestaña Ruta de Lectura"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.tabItem, activeTab === 'MAP' && styles.tabItemActive]}
            onPress={() => setCurrentView({ type: 'MAP' })}
          >
            <Text style={styles.tabIcon}>🗺️</Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.tabLabel, activeTab === 'MAP' && styles.tabLabelActive]}
            >
              Ruta
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'PROFILE' }}
            accessibilityLabel="Pestaña Mi Perfil y Logros"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.tabItem, activeTab === 'PROFILE' && styles.tabItemActive]}
            onPress={() => setCurrentView({ type: 'PROFILE' })}
          >
            <Text style={styles.tabIcon}>👤</Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.tabLabel, activeTab === 'PROFILE' && styles.tabLabelActive]}
            >
              Mi Perfil
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: colors.brandPrimary,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.brandPrimary,
  },
});
