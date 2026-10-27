import { formatWeeks, formatDays, formatDaysRemaining } from '../../../shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  EmptyState,
  Header,
  IconButton,
  Pill,
  ProgressBar,
  Screen,
  SectionHeader,
} from '../../../shared/components';
import { ApiError } from '../../../services/api/apiClient';
import { getPregnancyProfile } from '../../../services/api/pregnancyProfileApi';
import { getCurrentPregnancyWeekContent } from '../../../services/api/pregnancyWeeksApi';
import { getUpcomingVisits } from '../../../services/api/visitsApi';
import { formatVisitDateTime } from '../../doctor/mappers/doctorMappers';
import {
  getFruitImage,
  getFruitImageScale,
  hasFruitComparison,
} from '../../calendar/data/fruitImages';
import { getNewbornComparisonImage } from '../../calendar/data/babyImages';
import { colors, radius, spacing } from '../../../shared/theme';
import type {
  PregnancyProfile,
  PregnancyWeekContent,
  Visit,
} from '../../../types/api';

const profileAvatar = require('../../../../assets/images/profile-avatar.png');

type QuickActionConfig = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
  iconColor: string;
  available: boolean;
  href?: '/tabs/diary';
};

const quickActions: QuickActionConfig[] = [
  {
    title: 'Дневник',
    icon: 'format-list-bulleted-square',
    backgroundColor: colors.pinkSoft,
    iconColor: colors.primary,
    available: true,
    href: '/tabs/diary',
  },
  {
    title: 'Давление',
    icon: 'pulse',
    backgroundColor: colors.accentSoft,
    iconColor: colors.primaryDark,
    available: false,
  },
  {
    title: 'Вес',
    icon: 'weight',
    backgroundColor: colors.lavenderSoft,
    iconColor: colors.lavender,
    available: false,
  },
  {
    title: 'Вода',
    icon: 'water-outline',
    backgroundColor: colors.blueSoft,
    iconColor: '#2F80ED',
    available: false,
  },
];

export function HomeScreen() {
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [weekContent, setWeekContent] = useState<PregnancyWeekContent | null>(null);
  const [upcomingVisit, setUpcomingVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [weekContentMissing, setWeekContentMissing] = useState(false);
  const [visitsError, setVisitsError] = useState('');

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    setWeekContentMissing(false);
    setVisitsError('');

    try {
      const profileResponse = await getPregnancyProfile();
      const nextProfile = profileResponse.profile;
      setProfile(nextProfile);

      if (!nextProfile) {
        setWeekContent(null);
        setUpcomingVisit(null);
        return;
      }

      const [contentResult, visitsResult] = await Promise.allSettled([
        getCurrentPregnancyWeekContent(),
        getUpcomingVisits(),
      ]);

      if (contentResult.status === 'fulfilled') {
        setWeekContent(contentResult.value.content);
      } else {
        setWeekContent(null);
        if (isNotFoundError(contentResult.reason)) {
          setWeekContentMissing(true);
        } else {
          setLoadError(getErrorMessage(contentResult.reason));
        }
      }

      if (visitsResult.status === 'fulfilled') {
        setUpcomingVisit(visitsResult.value.visits[0] ?? null);
      } else {
        setUpcomingVisit(null);
        setVisitsError(getErrorMessage(visitsResult.reason));
      }
    } catch (error) {
      setProfile(null);
      setWeekContent(null);
      setUpcomingVisit(null);
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const currentWeek = profile?.pregnancyWeek ?? weekContent?.week ?? null;
  const currentDays = profile?.pregnancyDay ?? null;
  const trimesterLabel = formatTrimester(
    profile?.trimester ?? weekContent?.trimester ?? null,
  ).toUpperCase();
  const daysLeft = profile ? calculateDaysUntilDueDate(profile.dueDate) : null;
  const babySizeLabel =
    weekContent?.babySize ??
    (hasFruitComparison(weekContent?.fruitComparison)
      ? `с ${weekContent.fruitComparison}`
      : null);
  const fruitImage = getFruitImage(weekContent?.fruitComparison);
  const fruitImageScale = getFruitImageScale(weekContent?.fruitComparison);

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title={
          currentWeek !== null ? `${formatWeeks(currentWeek)} • Mamelia` : 'Mamelia'
        }
        avatarSource={profileAvatar}
        right={
          <IconButton
            icon={
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={colors.primary}
              />
            }
            label="Уведомления"
          />
        }
      />

      {isLoading ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем данные главной...
          </AppText>
        </Card>
      ) : null}

      {!isLoading && loadError ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Ошибка загрузки"
            description={loadError}
            actionTitle="Повторить"
            onActionPress={() => void loadHomeData()}
          />
        </Card>
      ) : null}

      {!isLoading && !loadError && !profile ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Профиль беременности не заполнен"
            description="Укажите дату последней менструации или дату родов, чтобы Mamelia показала срок."
            actionTitle="Рассчитать срок"
            onActionPress={() => router.push('/setup/due-date')}
          />
        </Card>
      ) : null}

      {!isLoading && profile ? (
        <>
          <View style={styles.termBlock}>
            <View style={styles.termTopRow}>
              <AppText variant="caption" color={colors.textSecondary} uppercase>
                Текущий срок
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} uppercase>
                {trimesterLabel}
              </AppText>
            </View>
            <View style={styles.termValueRow}>
              <AppText variant="title" color={colors.primary} style={styles.termValue}>
                {currentWeek !== null ? formatWeeks(currentWeek) : 'Срок уточняется'}
                {currentDays !== null ? ` ${formatDays(currentDays)}` : ''}
              </AppText>
              {daysLeft !== null ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  {formatDaysRemaining(daysLeft)}
                </AppText>
              ) : null}
            </View>
            <ProgressBar
              value={currentWeek ?? 0}
              max={42}
              height={12}
              fillColor={colors.pink}
              trackColor={colors.surfaceMuted}
            />
          </View>

          {weekContentMissing ? (
            <Card variant="muted" shadow="none" style={styles.stateCard}>
              <EmptyState
                title="Контент недели не найден"
                description="Для текущей недели описание пока не найдено."
              />
            </Card>
          ) : null}

          {weekContent ? (
            <Pressable
              accessibilityLabel={`Открыть неделю ${weekContent.week}`}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/tabs/calendar/[week]',
                  params: { week: String(weekContent.week) },
                })
              }
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={styles.growthCard}>
                <View style={styles.sizeComparisonFrame}>
                  {currentWeek !== null && currentWeek >= 40 ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      source={getNewbornComparisonImage()}
                      resizeMode="contain"
                      style={styles.fruitImage}
                    />
                  ) : fruitImage ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      source={fruitImage}
                      resizeMode="contain"
                      style={[
                        styles.fruitImage,
                        { width: `${64 * Math.min(1, Math.max(0, fruitImageScale))}%` },
                      ]}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="ruler"
                      size={56}
                      color={colors.primary}
                    />
                  )}
                </View>
                {babySizeLabel ? (
                  <Pill
                    label={`Размер ${babySizeLabel}`}
                    tone="peach"
                    style={styles.sizePill}
                  />
                ) : null}
                {hasFruitComparison(weekContent.fruitComparison) ? (
                  <AppText variant="caption" color={colors.textSecondary} align="center">
                    Как {weekContent.fruitComparison}
                  </AppText>
                ) : null}
                <AppText variant="subtitle" color={colors.primary} align="center">
                  {weekContent.title}
                </AppText>
                <AppText
                  variant="bodySmall"
                  color={colors.textSecondary}
                  align="center"
                  style={styles.growthText}
                >
                  {weekContent.babyDevelopment}
                </AppText>
              </Card>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <View style={styles.quickSection}>
        <SectionHeader title="Быстрые действия" />
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <QuickAction key={action.title} action={action} />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityLabel="Открыть вкладку Врач"
        accessibilityRole="button"
        onPress={() => router.push('/tabs/doctor')}
        style={({ pressed }) => [styles.visitCard, pressed && styles.pressed]}
      >
        <View style={styles.visitIcon}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={26}
            color={colors.primary}
          />
        </View>
        <View style={styles.visitCopy}>
          <AppText variant="bodySmall" color={colors.textPrimary} serif>
            Ближайший визит
          </AppText>
          {visitsError ? (
            <AppText variant="bodySmall" color={colors.danger}>
              {visitsError}
            </AppText>
          ) : null}
          {!visitsError && upcomingVisit ? (
            <>
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {formatVisitDateTime(upcomingVisit)}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {upcomingVisit.title}
                {upcomingVisit.specialist ? ` • ${upcomingVisit.specialist}` : ''}
              </AppText>
            </>
          ) : null}
          {!visitsError && !upcomingVisit ? (
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Визитов пока нет. Добавьте приём во вкладке «Врач».
            </AppText>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={28}
          color={colors.textSecondary}
        />
      </Pressable>

      {weekContent?.recommendation ? (
        <Card variant="accent" shadow="none" style={styles.adviceCard}>
          <AppText variant="label" color={colors.primary} uppercase>
            Рекомендация недели
          </AppText>
          <AppText variant="bodySmall" color={colors.primary}>
            {weekContent.recommendation}
          </AppText>
        </Card>
      ) : null}
    </Screen>
  );
}

type QuickActionProps = {
  action: QuickActionConfig;
};

function QuickAction({ action }: QuickActionProps) {
  return (
    <Pressable
      accessibilityLabel={
        action.available
          ? `Открыть: ${action.title}`
          : `${action.title}: пока недоступно`
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: !action.available }}
      disabled={!action.available}
      onPress={() => {
        if (action.available && action.href) {
          router.push(action.href);
        }
      }}
      style={({ pressed }) => [
        styles.quickAction,
        !action.available && styles.quickActionDisabled,
        pressed && action.available && styles.pressed,
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: action.backgroundColor }]}>
        <MaterialCommunityIcons
          name={action.icon}
          size={24}
          color={action.iconColor}
        />
      </View>
      <AppText variant="caption" color={colors.textSecondary} align="center" serif>
        {action.title}
      </AppText>
      {!action.available ? (
        <AppText variant="caption" color={colors.textMuted} align="center">
          Скоро
        </AppText>
      ) : null}
    </Pressable>
  );
}

function formatTrimester(trimester: number | null) {
  if (trimester === 1) {
    return 'I триместр';
  }

  if (trimester === 2) {
    return 'II триместр';
  }

  if (trimester === 3) {
    return 'III триместр';
  }

  return 'Триместр уточняется';
}

function calculateDaysUntilDueDate(dueDate: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = dueDate.split('-').map(Number);
  const dueDateStart = new Date(year, month - 1, day);
  const dayInMs = 24 * 60 * 60 * 1000;

  return Math.max(
    Math.ceil((dueDateStart.getTime() - todayStart.getTime()) / dayInMs),
    0,
  );
}

function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить данные главной.';
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  stateCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  termBlock: {
    gap: spacing.sm,
  },
  termTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termValueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  termValue: {
    flex: 1,
  },
  growthCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  sizeComparisonFrame: {
    alignItems: 'center',
    backgroundColor: colors.pinkSoft,
    borderColor: colors.pink,
    borderRadius: radius.pill,
    borderStyle: 'dashed',
    borderWidth: 2,
    aspectRatio: 1,
    maxWidth: '100%',
    justifyContent: 'center',
    opacity: 0.9,
    width: 150,
  },
  fruitImage: {
    // The square fits inside the circle, including a gap at its corners.
    aspectRatio: 1,
    width: '64%',
  },
  sizePill: {
    backgroundColor: colors.accentSoft,
  },
  growthText: {
    maxWidth: 280,
  },
  quickSection: {
    gap: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    minWidth: 62,
  },
  quickActionDisabled: {
    opacity: 0.45,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 64,
    justifyContent: 'center',
    width: 62,
  },
  visitCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 116,
    padding: spacing.xl,
    width: '100%',
  },
  visitIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  visitCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  adviceCard: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.accent,
    gap: spacing.md,
    padding: spacing.xl,
  },
  pressed: {
    opacity: 0.76,
  },
});
