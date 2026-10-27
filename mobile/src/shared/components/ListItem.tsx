import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type ListItemProps = PressableProps & {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  chevron?: boolean;
};

export function ListItem({
  title,
  subtitle,
  left,
  right,
  chevron = true,
  disabled,
  style,
  ...props
}: ListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.textGroup}>
        <AppText variant="body">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? (chevron ? <AppText color={colors.textMuted}>›</AppText> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.45,
  },
});
