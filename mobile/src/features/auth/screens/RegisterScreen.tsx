import { router } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Input, Screen } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { useAuth } from '../context/AuthContext';
import { AuthFieldIcon, PasswordToggle } from '../components/AuthFieldIcon';
import { AuthHero } from '../components/AuthHero';

const profileIcon = require('../../../../assets/icons/auth/profile.png');
const mailIcon = require('../../../../assets/icons/auth/mail.png');

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  privacyAccepted?: string;
  dataAccepted?: string;
  medicalDisclaimerAccepted?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;

export function RegisterScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = height < 760;
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dataAccepted, setDataAccepted] = useState(false);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors: RegisterErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Введите имя';
    }

    if (!email.trim()) {
      nextErrors.email = 'Введите электронную почту';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Введите корректный email';
    }

    if (!password) {
      nextErrors.password = 'Введите пароль';
    } else if (password.length < passwordMinLength) {
      nextErrors.password = 'Минимум 8 символов';
    }

    if (!privacyAccepted) {
      nextErrors.privacyAccepted = 'Нужно согласиться с политикой';
    }

    if (!dataAccepted) {
      nextErrors.dataAccepted = 'Нужно согласиться на обработку данных';
    }

    if (!medicalDisclaimerAccepted) {
      nextErrors.medicalDisclaimerAccepted = 'Нужно ознакомиться с медицинским дисклеймером';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (validateForm()) {
      setSubmitError('');
      setIsSubmitting(true);

      try {
        await register(name.trim(), email.trim(), password);
        router.replace('/setup/due-date');
      } catch (error) {
        setSubmitError(getSubmitErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen
        scroll={false}
        style={[
          styles.container,
          isCompact && styles.compactContainer,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View
            onTouchEnd={dismissKeyboardFromBackground}
            style={styles.innerContent}
          >
            <AuthHero
              compact={isCompact}
              title="Начните путь"
              description="Мы будем рядом на каждом этапе вашего прекрасного путешествия."
            />

            <View style={[styles.form, isCompact && styles.compactForm]}>
              <Input
                accessibilityLabel="Имя"
                autoCapitalize="words"
                error={errors.name}
                label="Имя"
                onChangeText={setName}
                placeholder="Как нам к вам обращаться?"
                rightIcon={<AuthFieldIcon source={profileIcon} />}
                textContentType="name"
                value={name}
                variant="filled"
              />
              <Input
                accessibilityLabel="Электронная почта"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                keyboardType="email-address"
                label="Электронная почта"
                onChangeText={setEmail}
                placeholder="example@mail.com"
                rightIcon={<AuthFieldIcon source={mailIcon} />}
                textContentType="emailAddress"
                value={email}
                variant="filled"
              />
              <Input
                accessibilityLabel="Пароль"
                error={errors.password}
                label="Пароль"
                onChangeText={setPassword}
                placeholder="Минимум 8 символов"
                rightIcon={
                  <PasswordToggle
                    isVisible={isPasswordVisible}
                    onPress={() => setIsPasswordVisible((value) => !value)}
                  />
                }
                secureTextEntry={!isPasswordVisible}
                textContentType="newPassword"
                value={password}
                variant="filled"
              />

              <View style={styles.checkboxGroup}>
                <CheckboxRow
                  checked={privacyAccepted}
                  error={errors.privacyAccepted}
                  label="Я согласна с Политикой конфиденциальности"
                  onPress={() => setPrivacyAccepted((value) => !value)}
                />
                <CheckboxRow
                  checked={dataAccepted}
                  error={errors.dataAccepted}
                  label="Я согласна на обработку персональных данных"
                  onPress={() => setDataAccepted((value) => !value)}
                />
                <MedicalDisclaimerCheckbox
                  checked={medicalDisclaimerAccepted}
                  error={errors.medicalDisclaimerAccepted}
                  onToggle={() => setMedicalDisclaimerAccepted((value) => !value)}
                  onOpenDisclaimer={() => router.push('/medical-disclaimer')}
                />
              </View>

              {submitError ? (
                <AppText variant="bodySmall" color={colors.danger} style={styles.errorText}>
                  {submitError}
                </AppText>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Button
                rightIcon={
                  <AppText variant="subtitle" color={colors.white}>
                    ›
                  </AppText>
                }
                title={isSubmitting ? 'Создаём...' : 'Создать аккаунт'}
                disabled={isSubmitting}
                onPress={handleSubmit}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/login')}
                style={styles.loginLink}
              >
                <AppText variant="bodySmall" color={colors.textSecondary} style={styles.centerText}>
                  Уже есть аккаунт?{' '}
                  <AppText variant="bodySmall" color={colors.primary} serif>
                    Войти
                  </AppText>
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function dismissKeyboardFromBackground(event: GestureResponderEvent) {
  if (event.target === event.currentTarget) {
    Keyboard.dismiss();
  }
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось создать аккаунт. Попробуйте ещё раз.';
}

type CheckboxRowProps = {
  checked: boolean;
  error?: string;
  label: string;
  onPress: () => void;
};

function CheckboxRow({ checked, error, label, onPress }: CheckboxRowProps) {
  return (
    <View style={styles.checkboxWrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onPress}
        style={styles.checkboxRow}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? (
            <AppText variant="caption" color={colors.white} align="center">
              ✓
            </AppText>
          ) : null}
        </View>
        <AppText
          variant="bodySmall"
          color={colors.textSecondary}
          style={styles.checkboxText}
        >
          {label}
        </AppText>
      </Pressable>
      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.checkboxError}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

type MedicalDisclaimerCheckboxProps = {
  checked: boolean;
  error?: string;
  onToggle: () => void;
  onOpenDisclaimer: () => void;
};

function MedicalDisclaimerCheckbox({
  checked,
  error,
  onToggle,
  onOpenDisclaimer,
}: MedicalDisclaimerCheckboxProps) {
  return (
    <View style={styles.checkboxWrapper}>
      <View style={styles.checkboxRow}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="Согласие с медицинским дисклеймером"
          hitSlop={12}
          onPress={onToggle}
          style={[styles.checkbox, checked && styles.checkboxChecked]}
        >
          {checked ? (
            <AppText variant="caption" color={colors.white} align="center">
              ✓
            </AppText>
          ) : null}
        </Pressable>

        <AppText
          variant="bodySmall"
          color={colors.textSecondary}
          style={styles.checkboxText}
        >
          Я ознакомилась с{' '}
          <AppText
            variant="bodySmall"
            color={colors.primary}
            style={styles.disclaimerLink}
            onPress={onOpenDisclaimer}
            accessibilityRole="link"
            accessibilityLabel="Медицинский дисклеймер"
          >
            Медицинским дисклеймером
          </AppText>
        </AppText>
      </View>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.checkboxError}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  container: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  compactContainer: {
    gap: spacing.lg,
  },
  form: {
    gap: spacing.lg,
    width: '100%',
  },
  compactForm: {
    gap: spacing.md,
  },
  checkboxGroup: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  checkboxWrapper: {
    gap: spacing.xs,
  },
  checkboxRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    flex: 1,
  },
  checkboxError: {
    paddingLeft: 34,
    flexWrap: 'wrap',
  },
  errorText: {
    flexWrap: 'wrap',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  loginLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  centerText: {
    textAlign: 'center',
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
  },
});
