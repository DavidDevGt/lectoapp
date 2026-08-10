import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';

// Mantenemos el splash visible mientras se restaura la sesión guardada, para no
// mostrar el login por un instante a alguien que ya había iniciado sesión.
void SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isBootstrapping } = useAuth();

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void hideSplash();
  }, [isBootstrapping, hideSplash]);

  if (isBootstrapping) return null;

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="dark" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
