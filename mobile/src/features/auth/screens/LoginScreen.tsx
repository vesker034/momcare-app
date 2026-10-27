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
import { colors, spacing } from '../../../shared/theme';
import { useAuth } from '../context/AuthContext';
import { AuthFieldIcon, PasswordToggle } from '../components/AuthFieldIcon';
import { AuthHero } from '../components/AuthHero';

const mailIcon = require('../../../../assets/icons/auth/mail.png');

type LoginErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;

export function LoginScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = height < 760;
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors: LoginErrors = {};

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

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (validateForm()) {
      setSubmitError('');
      setIsSubmitting(true);

      try {
        await login(email.trim(), password);
        router.replace('/tabs/home');
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
            <View style={styles.mainContent}>
              <AuthHero
                compact={isCompact}
                title="Рады видеть вас снова"
                description="Войдите в свой аккаунт, чтобы продолжить путь."
              />

              <View style={[styles.form, isCompact && styles.compactForm]}>
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
                  placeholder="Введите пароль"
                  rightIcon={
                    <PasswordToggle
                      isVisible={isPasswordVisible}
                      onPress={() => setIsPasswordVisible((value) => !value)}
                    />
                  }
                  secureTextEntry={!isPasswordVisible}
                  textContentType="password"
                  value={password}
                  variant="filled"
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={() => undefined}
                  style={styles.forgotLink}
                >
                  <AppText variant="bodySmall" color={colors.primary} serif>
                    Забыли пароль?
                  </AppText>
                </Pressable>

                {submitError ? (
                  <AppText variant="bodySmall" color={colors.danger} style={styles.errorText}>
                    {submitError}
                  </AppText>
                ) : null}
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                rightIcon={
                  <AppText variant="subtitle" color={colors.white}>
                    ›
                  </AppText>
                }
                title={isSubmitting ? 'Входим...' : 'Войти'}
                disabled={isSubmitting}
                onPress={handleSubmit}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/register')}
                style={styles.registerLink}
              >
                <AppText variant="bodySmall" color={colors.textSecondary} style={styles.centerText}>
                  Ещё нет аккаунта?{' '}
                  <AppText variant="bodySmall" color={colors.primary} serif>
                    Создать
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

  return 'Не удалось войти. Проверьте данные и попробуйте ещё раз.';
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
  mainContent: {
    gap: spacing.xl,
    width: '100%',
  },
  container: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  compactContainer: {
    paddingBottom: spacing.lg,
  },
  form: {
    gap: spacing.lg,
    width: '100%',
  },
  compactForm: {
    gap: spacing.md,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  errorText: {
    flexWrap: 'wrap',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  registerLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  centerText: {
    textAlign: 'center',
  },
});
