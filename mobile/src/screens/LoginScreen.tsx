import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { login, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('carlos.mendoza@estudiante.edu.gt');
  const [password, setPassword] = useState('Estudiante123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 12,
  );

  const handleLogin = async (loginEmail = email, loginPass = password) => {
    if (!loginEmail || !loginPass) {
      setErrorMessage('Por favor ingresa tu correo y contraseña');
      return;
    }
    setErrorMessage('');
    const ok = await login(loginEmail, loginPass);
    if (ok) {
      onLoginSuccess();
    } else {
      setErrorMessage('No se pudo iniciar sesión. Verifica tus credenciales.');
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Estudiante123!');
    setErrorMessage('');
  };

  return (
    <View style={[styles.safeContainer, { paddingTop: topPadding }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Hero Branding */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadgeContainer}>
              <Text style={styles.logoEmoji}>📚✨</Text>
            </View>
            <Text maxFontSizeMultiplier={1.2} style={styles.heroTitle}>
              LectoApp
            </Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.heroSubtitle}>
              Comprensión Lectora Gamificada para Guatemala
            </Text>
            <View style={styles.badgePill}>
              <Text maxFontSizeMultiplier={1.2} style={styles.badgePillText}>
                🇬🇹 Plataforma Educativa Oficial
              </Text>
            </View>
          </View>

          {/* Formulario Principal de Acceso */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text maxFontSizeMultiplier={1.2} style={styles.cardTitle}>
                ¡Bienvenido a tu Aventura!
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.cardSubtitle}>
                Ingresa con tu cuenta de estudiante para continuar tu ruta
              </Text>
            </View>

            {Boolean(errorMessage) && (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text maxFontSizeMultiplier={1.2} style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Input Correo */}
            <View style={styles.inputGroup}>
              <Text maxFontSizeMultiplier={1.2} style={styles.inputLabel}>
                Correo escolar o de estudiante
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'email' && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage('');
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="ejemplo@estudiante.edu.gt"
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Input Contraseña */}
            <View style={styles.inputGroup}>
              <Text maxFontSizeMultiplier={1.2} style={styles.inputLabel}>
                Contraseña
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'password' && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage('');
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeToggle}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Botón Principal de Submit */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión en LectoApp"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={() => handleLogin()}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.textOnBrand} size="small" />
                  <Text style={styles.submitButtonText}>Ingresando...</Text>
                </View>
              ) : (
                <Text maxFontSizeMultiplier={1.2} style={styles.submitButtonText}>
                  Entrar a LectoApp →
                </Text>
              )}
            </Pressable>

            {/* Accesos Rápidos Demo */}
            <View style={styles.demoSection}>
              <Text maxFontSizeMultiplier={1.2} style={styles.demoTitle}>
                Acceso Rápido de Prueba:
              </Text>
              <View style={styles.demoRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cargar credenciales de Carlos Mendoza"
                  style={styles.demoChip}
                  onPress={() => fillQuickDemo('carlos.mendoza@estudiante.edu.gt')}
                >
                  <Text style={styles.demoChipIcon}>👨‍🎓</Text>
                  <Text style={styles.demoChipText}>Carlos Mendoza</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cargar credenciales de Lucía Ramos"
                  style={styles.demoChip}
                  onPress={() => fillQuickDemo('lucia.ramos@estudiante.edu.gt')}
                >
                  <Text style={styles.demoChipIcon}>👩‍🎓</Text>
                  <Text style={styles.demoChipText}>Lucía Ramos</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Pie de página con información de confianza */}
          <View style={styles.footerSection}>
            <Text maxFontSizeMultiplier={1.2} style={styles.footerText}>
              Aprende, acumula puntos 🪙 y mejora tu comprensión lectora con las mejores lecturas de Guatemala.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  flexContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
  logoBadgeContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.brandLightText,
    ...shadows.sm,
  },
  logoEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.brandPrimary,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  badgePill: {
    backgroundColor: colors.bgSunken,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardContainer: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cardHeader: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.dangerSolid,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    color: colors.dangerFg,
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSunken,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.bgSurface,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  eyeToggle: {
    padding: spacing.xs,
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitButton: {
    backgroundColor: colors.brandPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  submitButtonPressed: {
    backgroundColor: colors.brandHover,
    opacity: 0.95,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    color: colors.textOnBrand,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  demoSection: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  demoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSunken,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  demoChipIcon: {
    fontSize: 14,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  footerSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
