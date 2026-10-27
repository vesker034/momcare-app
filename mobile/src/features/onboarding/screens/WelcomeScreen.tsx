import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '../../../config/constants';
import { AppText, Button, Screen } from '../../../shared/components';
import { colors, radius, shadows, spacing } from '../../../shared/theme';

const motherIllustration = require('../../../../assets/images/onboarding-mother.png');

const MAX_CONTENT_WIDTH = 840;

export function WelcomeScreen() {
  const { fontScale, height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const horizontalPadding = spacing.lg;
  const contentWidth = Math.min(width - horizontalPadding * 2, MAX_CONTENT_WIDTH);
  const isCompact = height < 740 || fontScale > 1.1;
  const heroSize = Math.min(contentWidth, isCompact ? 220 : 280);

  return (
    <Screen
      scroll={false}
      withHorizontalPadding={false}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: spacing.md,
            paddingBottom: Math.max(insets.bottom, spacing.md),
            paddingHorizontal: horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <View style={[styles.inner, { maxWidth: contentWidth }]}>
          <View style={styles.logoGroup}>
            <View style={styles.logoIcon}>
              <AppText variant="subtitle" color={colors.primaryDark} align="center">
                ♥
              </AppText>
            </View>
            <AppText variant="cardTitle" color={colors.primary} align="center">
              {APP_NAME}
            </AppText>
          </View>

          <View
            style={[
              styles.heroWrapper,
              { height: heroSize, width: heroSize },
            ]}
          >
            <View style={styles.heroFrame}>
              <View style={styles.heroBackdrop} />
              <View style={styles.heroImageClip}>
                <Image
                  source={motherIllustration}
                  resizeMode="cover"
                  style={styles.heroImage}
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomGroup}>
            <View style={styles.copyGroup}>
              <AppText
                variant="hero"
                align="center"
                style={styles.title}
                maxFontSizeMultiplier={1.3}
              >
                Поддержка беременности каждый день
              </AppText>
              <AppText
                variant="body"
                color={colors.textSecondary}
                align="center"
                style={styles.description}
                maxFontSizeMultiplier={1.3}
              >
                Персональный календарь развития малыша, дневник
                самочувствия и полезные материалы в одном приложении.
              </AppText>
            </View>

            <View style={styles.actions}>
              <Button title="Начать" onPress={() => router.push('/register')} />
              <Button
                title="Войти"
                variant="outline"
                onPress={() => router.push('/login')}
                style={styles.secondaryButton}
              />
            </View>

            <AppText
              variant="caption"
              color={colors.textMuted}
              align="center"
              maxFontSizeMultiplier={1.2}
            >
              Данные защищены и конфиденциальны
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoGroup: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoIcon: {
    alignItems: 'center',
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    width: 64,
    ...shadows.soft,
  },
  heroWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    flexShrink: 1,
  },
  heroFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    alignItems: 'center',
    backgroundColor: colors.peachSoft,
    borderColor: colors.white,
    borderWidth: 4,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.soft,
  },
  heroBackdrop: {
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    height: '82%',
    opacity: 0.58,
    position: 'absolute',
    right: -spacing.xl,
    top: spacing.xl,
    width: '82%',
  },
  heroImageClip: {
    borderRadius: radius.pill,
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  bottomGroup: {
    gap: spacing.md,
    width: '100%',
  },
  copyGroup: {
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  title: {
    maxWidth: '100%',
  },
  description: {
    maxWidth: '100%',
  },
  actions: {
    gap: spacing.sm,
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
});
