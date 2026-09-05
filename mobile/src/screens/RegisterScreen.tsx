import React, { useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, layout, shadows, spacing, touchTarget } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { ApiError, toUserMessage } from '../api/errors';
import { Button } from '../components/ui/Button';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const GRADE_LEVELS = [
  'Primaria (1ro–3ro)',
  'Primaria (4to–6to)',
  'Básicos (1ro–3ro)',
  'Diversificado',
  'Universidad',
  'Otro',
];

export function RegisterScreen({ navigation }: Props) {
  const { register, isRegistering } = useAuth();
  const insets = useSafeAreaInsets();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message: string) => {
    setErrorMessage(message);
    AccessibilityInfo.announceForAccessibility(message);
  };

  const handleRegister = async () => {
    const trimName = name.trim();
    const trimEmail = email.trim();

    if (!trimName) { showError('Ingresa tu nombre completo.'); return; }
    if (trimName.length < 2) { showError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!trimEmail) { showError('Ingresa tu correo electrónico.'); return; }
    if (!password) { showError('Ingresa una contraseña.'); return; }
    if (password.length < 8) { showError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirmPassword) { showError('Las contraseñas no coinciden.'); return; }

    setErrorMessage('');
    try {
      await register(trimName, trimEmail, password, gradeLevel || undefined);
      // El cambio de sesión reemplaza el stack automáticamente.
    } catch (error) {
      const isDuplicate = error instanceof ApiError && error.status === 409;
      const isValidation = error instanceof ApiError && error.status === 422;
      showError(
        isDuplicate
          ? 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.'
          : isValidation
            ? 'Verifica que todos los campos sean correctos.'
            : toUserMessage(error),
      );
    }
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
            <View style={styles.headerSection}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Crear cuenta
              </Text>
              <Text style={styles.heroSubtitle}>
                Únete a LectoApp y comienza tu aventura de comprensión lectora
              </Text>
            </View>

            <View style={styles.cardContainer}>
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

              {/* Nombre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} nativeID="labelName">
                  Nombre completo
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === 'name' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    accessibilityLabelledBy="labelName"
                    accessibilityLabel="Nombre completo"
                    value={name}
                    onChangeText={(val) => { setName(val); setErrorMessage(''); }}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Tu nombre y apellido"
                    placeholderTextColor={colors.textSubtle}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Correo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} nativeID="labelEmail">
                  Correo electrónico
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === 'email' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    ref={emailRef}
                    style={styles.textInput}
                    accessibilityLabelledBy="labelEmail"
                    accessibilityLabel="Correo electrónico"
                    value={email}
                    onChangeText={(val) => { setEmail(val); setErrorMessage(''); }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor={colors.textSubtle}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} nativeID="labelPass">
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
                    accessibilityLabelledBy="labelPass"
                    accessibilityLabel="Contraseña"
                    value={password}
                    onChangeText={(val) => { setPassword(val); setErrorMessage(''); }}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={colors.textSubtle}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <Pressable
                    hitSlop={12}
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeToggle}
                    accessibilityRole="button"
                    accessibilityState={{ selected: showPassword }}
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

              {/* Confirmar contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} nativeID="labelConfirm">
                  Confirmar contraseña
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedInput === 'confirm' && styles.inputWrapperFocused,
                    password && confirmPassword && password !== confirmPassword && styles.inputWrapperError,
                  ]}
                >
                  <TextInput
                    ref={confirmRef}
                    style={styles.textInput}
                    accessibilityLabelledBy="labelConfirm"
                    accessibilityLabel="Confirmar contraseña"
                    value={confirmPassword}
                    onChangeText={(val) => { setConfirmPassword(val); setErrorMessage(''); }}
                    onFocus={() => setFocusedInput('confirm')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Repite tu contraseña"
                    placeholderTextColor={colors.textSubtle}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={() => void handleRegister()}
                  />
                  <Pressable
                    hitSlop={12}
                    onPress={() => setShowConfirm((prev) => !prev)}
                    style={styles.eyeToggle}
                    accessibilityRole="button"
                    accessibilityState={{ selected: showConfirm }}
                    accessibilityLabel={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  >
                    <Text
                      style={styles.eyeIcon}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Grado escolar (opcional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Grado escolar{' '}
                  <Text style={styles.optionalLabel}>(opcional)</Text>
                </Text>
                <Pressable
                  style={[
                    styles.inputWrapper,
                    styles.gradeSelector,
                    showGradePicker && styles.inputWrapperFocused,
                  ]}
                  onPress={() => setShowGradePicker((prev) => !prev)}
                  accessibilityRole="combobox"
                  accessibilityLabel="Grado escolar"
                  accessibilityState={{ expanded: showGradePicker }}
                  accessibilityValue={{ text: gradeLevel || 'No seleccionado' }}
                >
                  <Text
                    style={[styles.textInput, !gradeLevel && { color: colors.textSubtle }]}
                  >
                    {gradeLevel || 'Selecciona tu grado'}
                  </Text>
                  <Text
                    style={styles.eyeIcon}
                    importantForAccessibility="no"
                    accessibilityElementsHidden
                  >
                    {showGradePicker ? '🔼' : '🔽'}
                  </Text>
                </Pressable>
                {showGradePicker && (
                  <View style={styles.gradeOptions}>
                    {GRADE_LEVELS.map((level) => (
                      <Pressable
                        key={level}
                        style={[
                          styles.gradeOption,
                          gradeLevel === level && styles.gradeOptionActive,
                        ]}
                        onPress={() => { setGradeLevel(level); setShowGradePicker(false); }}
                        accessibilityRole="menuitem"
                        accessibilityState={{ selected: gradeLevel === level }}
                        accessibilityLabel={level}
                      >
                        <Text
                          style={[
                            styles.gradeOptionText,
                            gradeLevel === level && styles.gradeOptionTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                        {gradeLevel === level && (
                          <Text style={styles.gradeCheck} importantForAccessibility="no">✓</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Button
                label="Crear mi cuenta"
                loadingLabel="Creando cuenta…"
                loading={isRegistering}
                onPress={() => void handleRegister()}
                accessibilityLabel="Crear cuenta en LectoApp"
                style={styles.submitButton}
              />
            </View>

            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkText}>¿Ya tienes cuenta?</Text>
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Ir a iniciar sesión"
              >
                <Text style={styles.loginLinkAction}> Iniciar sesión</Text>
              </Pressable>
            </View>
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
  headerSection: {
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
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
    fontWeight: '500',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  cardContainer: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
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
  errorIcon: { fontSize: 16 },
  errorText: {
    flex: 1,
    color: colors.dangerFg,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  optionalLabel: {
    fontWeight: '400',
    color: colors.textMuted,
    fontSize: 13,
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
  inputWrapperError: {
    borderColor: colors.dangerSolid,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  eyeToggle: { padding: spacing.sm },
  eyeIcon: { fontSize: 18 },
  gradeSelector: { cursor: 'pointer' } as object,
  gradeOptions: {
    marginTop: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gradeOptionActive: { backgroundColor: colors.brandPrimary + '1A' },
  gradeOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  gradeOptionTextActive: { color: colors.brandPrimary, fontWeight: '700' },
  gradeCheck: { fontSize: 16, color: colors.brandPrimary },
  submitButton: { marginTop: spacing.sm },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  loginLinkAction: {
    fontSize: 14,
    color: colors.brandPrimary,
    fontWeight: '700',
  },
});
