import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type HeaderProps = {
  title: string;
  subtitle?: string;
  avatarSource?: ImageSourcePropType;
  left?: ReactNode;
  right?: ReactNode;
  centered?: boolean;
};

export function Header({
  title,
  subtitle,
  avatarSource,
  left,
  right,
  centered = false,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {left ??
          (avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : null)}
      </View>
      <View style={[styles.titleGroup, centered && styles.centered]}>
        <AppText
          variant="cardTitle"
          color={colors.primary}
          align={centered ? 'center' : 'left'}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="caption"
            color={colors.textMuted}
            align={centered ? 'center' : 'left'}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
    width: '100%',
  },
  side: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 44,
  },
  right: {
    alignItems: 'flex-end',
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xxs,
  },
  centered: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.peach,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 44,
    width: 44,
  },
});
