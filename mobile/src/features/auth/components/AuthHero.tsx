import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { APP_NAME } from '../../../config/constants';
import { AppText, Card, IconButton } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';

const motherIllustration = require('../../../../assets/images/onboarding-mother.png');

type AuthHeroProps = {
  title: string;
  description: string;
  compact?: boolean;
};

export function AuthHero({ title, description, compact = false }: AuthHeroProps) {
  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      <View style={styles.topBar}>
        <IconButton
          icon={
            <AppText variant="subtitle" color={colors.primary}>
              ‹
            </AppText>
          }
          label="Назад"
          onPress={() => router.back()}
        />
        <AppText variant="cardTitle" color={colors.primary} align="center">
          {APP_NAME}
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={[styles.hero, compact && styles.compactHero]}>
        <View style={styles.illustrationFrame}>
          <Card padded={false} shadow="soft" style={styles.avatarCard}>
            <Image
              source={motherIllustration}
              resizeMode="cover"
              style={styles.avatarImage}
            />
          </Card>
        </View>

        <View style={styles.copyGroup}>
          <AppText variant="hero" color={colors.primary} align="center" style={styles.title}>
            {title}
          </AppText>
          <AppText
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={styles.description}
          >
            {description}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xl,
    width: '100%',
  },
  compactWrapper: {
    gap: spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  topBarSpacer: {
    width: 44,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xl,
    width: '100%',
  },
  compactHero: {
    gap: spacing.lg,
  },
  illustrationFrame: {
    alignItems: 'center',
    height: 124,
    justifyContent: 'center',
    width: 124,
  },
  avatarCard: {
    backgroundColor: colors.peach,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 4,
    height: 124,
    overflow: 'hidden',
    width: 124,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  copyGroup: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    width: '100%',
  },
  description: {
    width: '100%',
  },
});