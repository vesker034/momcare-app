import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type PillTone = 'neutral' | 'primary' | 'pink' | 'peach' | 'lavender';

type PillProps = ViewProps & {
  label: string;
  tone?: PillTone;
  selected?: boolean;
  icon?: ReactNode;
};

export function Pill({
  label,
  tone = 'neutral',
  selected = false,
  icon,
  style,
  ...props
}: PillProps) {
  return (
    <View
      {...props}
      style={[styles.base, styles[tone], selected && styles.selected, style]}
    >
      {icon}
      <AppText
        variant="bodySmall"
        color={selected ? colors.primaryDark : colors.textSecondary}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  pink: {
    backgroundColor: colors.pinkSoft,
    borderColor: 'transparent',
    borderWidth: 1,
  },
  peach: {
    backgroundColor: colors.peachSoft,
    borderColor: 'transparent',
    borderWidth: 1,
  },
  lavender: {
    backgroundColor: colors.lavenderSoft,
    borderColor: 'transparent',
    borderWidth: 1,
  },
  selected: {
    borderColor: colors.pink,
  },
});
