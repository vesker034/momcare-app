import type { ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type InputVariant = 'outline' | 'filled';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  /**
   * Kept optional for older screens, but auth forms use rightIcon only.
   */
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightElement?: ReactNode;
  variant?: InputVariant;
  containerStyle?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  rightElement,
  variant = 'outline',
  containerStyle,
  shellStyle,
  inputStyle,
  style,
  accessibilityLabel,
  ...props
}: InputProps) {
  const trailingIcon = rightIcon ?? rightElement;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <AppText variant="caption" color={colors.textSecondary} serif>
        {label}
      </AppText>
      <View
        style={[
          styles.inputShell,
          styles[variant],
          error ? styles.inputError : undefined,
          shellStyle,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={colors.border}
          style={[styles.input, inputStyle, style]}
          {...props}
        />
        {trailingIcon ? <View style={styles.rightIcon}>{trailingIcon}</View> : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: spacing.xs,
  },
  inputShell: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  outline: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  filled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    minHeight: 54,
  },
  leftIcon: {
    marginRight: spacing.md,
  },
  rightIcon: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    padding: spacing.sm,
    width: 40,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
