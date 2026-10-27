import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { colors, radius, shadows, spacing } from '../theme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  disabled,
  style,
  leftIcon,
  rightIcon,
  contentStyle,
  ...props
}: ButtonProps) {
  const isLight = variant === 'ghost' || variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <View style={[styles.content, contentStyle]}>
        {leftIcon}
        <AppText variant="button" color={isLight ? colors.primary : colors.white}>
          {title}
        </AppText>
        {rightIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
  },
  md: {
    minHeight: 44,
  },
  lg: {
    minHeight: 60,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.pink,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.5,
  },
} satisfies Record<string, ViewStyle>);
