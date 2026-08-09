import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('carlos.mendoza@estudiante.edu.gt');
  const [password, setPassword] = useState('Estudiante123!');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña');
      return;
    }
    setErrorMessage('');
    const ok = await login(email, password);
    if (ok) {
      onLoginSuccess();
    } else {
      setErrorMessage('No se pudo iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Logo & Header */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>📚✨</Text>
            </View>
            <Text style={styles.appName}>LectoApp</Text>
            <Text style={styles.appTagline}>Comprensión Lectora Gamificada</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>¡Bienvenido a tu aventura!</Text>
            <Text style={styles.cardSubtitle}>Ingresa tu correo escolar para comenzar</Text>

            {Boolean(errorMessage) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ejemplo@estudiante.edu.gt"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textOnBrand} />
              ) : (
                <Text style={styles.submitButtonText}>Entrar a LectoApp →</Text>
              )}
            </Pressable>
          </View>

          {/* Footer note */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              🇬🇹 Plataforma educativa de comprensión lectora para Guatemala
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.brandPrimary,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.dangerFg,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonPressed: {
    backgroundColor: colors.brandHover,
  },
  submitButtonText: {
    color: colors.textOnBrand,
    fontWeight: '800',
    fontSize: 16,
  },
  footerInfo: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
