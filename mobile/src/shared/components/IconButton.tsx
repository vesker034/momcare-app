import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '../theme';

type IconButtonVariant = 'plain' | 'soft' | 'filled';
type IconButtonSize = 'sm' | 'md' | 'lg';

type IconButtonProps = PressableProps & {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  label,
  variant = 'plain',
  size = 'md',
  disabled,
  style,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  sm: {
    height: 36,
    width: 36,
  },
  md: {
    height: 44,
    width: 44,
  },
  lg: {
    height: 56,
    width: 56,
  },
  plain: {
    backgroundColor: 'transparent',
  },
  soft: {
    backgroundColor: colors.pinkSoft,
    padding: spacing.sm,
  },
  filled: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});
