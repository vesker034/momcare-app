import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';

type CardVariant = 'default' | 'muted' | 'rose' | 'accent';

type CardProps = ViewProps & {
  variant?: CardVariant;
  padded?: boolean;
  shadow?: keyof typeof shadows;
};

export function Card({
  variant = 'default',
  padded = true,
  shadow = 'soft',
  style,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      style={[
        styles.card,
        styles[variant],
        padded && styles.padded,
        shadows[shadow],
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  padded: {
    padding: spacing.xl,
  },
  default: {
    backgroundColor: colors.surface,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  rose: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pinkSoft,
  },
  accent: {
    backgroundColor: colors.peachSoft,
    borderColor: colors.accent,
  },
});
