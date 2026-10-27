import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { colors, typography } from '../theme';

type TextVariant = keyof typeof typography;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  serif?: boolean;
  uppercase?: boolean;
};

export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  align,
  serif,
  uppercase,
  style,
  children,
  ...props
}: AppTextProps) {
  const useSerif =
    serif || variant === 'hero' || variant === 'title' || variant === 'subtitle';

  return (
    <Text
      {...props}
      style={[
        styles.base,
        useSerif && styles.serif,
        typography[variant],
        uppercase && styles.uppercase,
        { color },
        align ? { textAlign: align } : undefined,
        style,
      ]}
    >
      {typeof children === 'string' && uppercase
        ? children.toUpperCase()
        : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
  serif: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
