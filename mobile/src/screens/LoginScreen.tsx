import React, { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, layout, shadows, spacing, touchTarget } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { ApiError, toUserMessage } from '../api/errors';
import { Button } from '../components/ui/Button';

/** Credenciales de prueba: solo existen en builds de desarrollo. */
const DEMO_ACCOUNTS = [
  { label: 'Carlos Mendoza', email: 'carlos.mendoza@estudiante.edu.gt' },
  { label: 'Lucía Ramos', email: 'lucia.ramos@estudiante.edu.gt' },
];
const DEMO_PASSWORD = 'Estudiante123!';

export function LoginScreen() {
  const { login, isLoggingIn } = useAuth();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const showError = (message: string) => {
    setErrorMessage(message);
    AccessibilityInfo.announceForAccessibility(message);
  };

  const handleLogin = async (loginEmail = email, loginPass = password) => {
    if (!loginEmail.trim() || !loginPass) {
      showError('Ingresa tu correo y tu contraseña para continuar.');
      return;
    }
    setErrorMessage('');
    try {
      await login(loginEmail.trim(), loginPass);
      // El cambio de sesión reemplaza el stack: no hace falta navegar a mano.
    } catch (error) {
      const isCredentials = error instanceof ApiError && error.status === 401;
      showError(
        isCredentials
          ? 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.'
          : toUserMessage(error),
      );
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setErrorMessage('');
  };

  return (
    <View style={[styles.safeContainer, { paddingTop: Math.max(insets.top, spacing.md) }]}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.column}>
            <View style={styles.heroSection}>
              <View style={styles.logoBadgeContainer}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                  accessible={false}
                />
              </View>
              <Text style={styles.heroTitle} accessibilityRole="header">
                LectoApp
              </Text>
              <Text style={styles.heroSubtitle}>
                Comprensión Lectora Gamificada para Guatemala
              </Text>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} accessibilityRole="header">
                  ¡Bienvenido a tu Aventura!
                </Text>
                <Text style={styles.cardSubtitle}>
                  Ingresa con tu cuenta de estudiante para continuar tu ruta
                </Text>
              </View>

              {Boolean(errorMessage) && (
                <View style={styles.errorBanner} accessibilityRole="alert" accessible>
                  <Text
                    style={styles.errorIcon}
                    importantForAccessibility="no"
                    accessibilityElementsHidden
                  >
                    ⚠️
                  </Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} nativeID="labelEmail">
                  Correo escolar o de estudiante
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === 'email' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    accessibilityLabelledBy="labelEmail"
                    accessibilityLabel="Correo escolar o de estudiante"
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
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="username"
                    autoComplete="email"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} nativeID="labelPassword">
                  Contraseña
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
                    style={styles.textInput}
                    accessibilityLabelledBy="labelPassword"
                    accessibilityLabel="Contraseña"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrorMessage('');
                    }}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Tu contraseña"
                    placeholderTextColor={colors.textSubtle}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="current-password"
                    returnKeyType="go"
                    onSubmitEditing={() => void handleLogin()}
                  />
                  <Pressable
                    hitSlop={12}
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeToggle}
                    accessibilityRole="button"
                    accessibilityState={{ selected: showPassword }}
                    accessibilityLabel={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <Text
                      style={styles.eyeIcon}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Button
                label="Entrar a LectoApp"
                loadingLabel="Ingresando…"
                loading={isLoggingIn}
                onPress={() => void handleLogin()}
                accessibilityLabel="Iniciar sesión en LectoApp"
                style={styles.submitButton}
              />

              {__DEV__ && (
                <View style={styles.demoSection}>
                  <Text style={styles.demoTitle}>Acceso rápido (solo desarrollo)</Text>
                  <View style={styles.demoRow}>
                    {DEMO_ACCOUNTS.map((account) => (
                      <Button
                        key={account.email}
                        label={account.label}
                        variant="secondary"
                        onPress={() => fillDemo(account.email)}
                        accessibilityLabel={`Cargar credenciales de ${account.label}`}
                        style={styles.demoChip}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.footerText}>
              Aprende, acumula puntos y mejora tu comprensión lectora con las mejores lecturas
              de Guatemala.
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
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
  logoBadgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.brandPrimary,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
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
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
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
    minHeight: touchTarget.comfortable,
  },
  inputWrapperFocused: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.bgSurface,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  eyeToggle: {
    padding: spacing.sm,
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitButton: {
    marginTop: spacing.sm,
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
    paddingHorizontal: spacing.sm,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
});
