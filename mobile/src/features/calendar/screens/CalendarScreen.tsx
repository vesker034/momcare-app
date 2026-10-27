import { formatWeeks, formatDays, formatPregnancyTerm } from '../../../shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  Pill,
  ProgressBar,
  Screen,
} from '../../../shared/components';
import { ApiError } from '../../../services/api/apiClient';
import { getPregnancyProfile } from '../../../services/api/pregnancyProfileApi';
import { getPregnancyWeeks } from '../../../services/api/pregnancyWeeksApi';
import { colors, radius, shadows, spacing } from '../../../shared/theme';
import type { PregnancyWeekSummary } from '../../../types/api';
import {
  consumeCurrentCalendarWeekRequest,
  consumeCalendarFocusWeek,
  peekCalendarTrimester,
  rememberCalendarReturn,
  rememberCalendarTrimester,
} from '../data/calendarUiState';
import {
  getFruitImage,
  getFruitImageScale,
  hasFruitComparison,
} from '../data/fruitImages';
import { trimesterRanges, type TrimesterId } from '../data/pregnancyWeeks';
import {
  calculateDaysUntilDueDate,
  getTrimesterId,
  getTrimesterLabel,
} from '../mappers/calendarMappers';

const trimesterTabs: Array<{ id: TrimesterId; label: string }> = [
  { id: 1, label: '1 триместр' },
  { id: 2, label: '2 триместр' },
  { id: 3, label: '3 триместр' },
];

type WeeksLoadState =
  | { status: 'loading' }
  | { status: 'ready'; weeks: PregnancyWeekSummary[] }
  | { status: 'empty' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

type ProfileLoadState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'missing' }
  | { status: 'error'; message: string };

export function CalendarScreen() {
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [profileState, setProfileState] = useState<ProfileLoadState>({ status: 'loading' });
  const [selectedTrimester, setSelectedTrimester] = useState<TrimesterId>(
    peekCalendarTrimester() ?? getTrimesterId(1),
  );
  const [weeksState, setWeeksState] = useState<WeeksLoadState>({
    status: 'loading',
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [focusWeek, setFocusWeek] = useState<number | null>(null);
  const didInitTrimesterFromProfile = useRef(Boolean(peekCalendarTrimester()));
  const weekOffsetsRef = useRef<Record<number, number>>({});
  const weekListOffsetRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const reloadCalendar = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  const selectTrimester = useCallback((trimester: TrimesterId) => {
    setSelectedTrimester(trimester);
    setFocusWeek(null);
    rememberCalendarTrimester(trimester);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const rememberedTrimester = peekCalendarTrimester();
      const rememberedWeek = consumeCalendarFocusWeek();
      const openCurrentWeek = consumeCurrentCalendarWeekRequest();

      if (!openCurrentWeek && rememberedTrimester) {
        setSelectedTrimester(rememberedTrimester);
        didInitTrimesterFromProfile.current = true;
      }

      if (!openCurrentWeek && rememberedWeek) {
        setFocusWeek(rememberedWeek);
      } else if (openCurrentWeek) {
        setFocusWeek(null);
      }

      async function loadCalendarData() {
        setWeeksState({ status: 'loading' });
        setProfileState({ status: 'loading' });
        setCurrentWeek(null);
        setCurrentDay(null);
        setDaysLeft(null);

        const [profileResult, weeksResult] = await Promise.allSettled([
          getPregnancyProfile(),
          getPregnancyWeeks(),
        ]);

        if (!isActive) {
          return;
        }

        if (profileResult.status === 'fulfilled') {
          const profile = profileResult.value.profile;

          if (profile?.pregnancyWeek) {
            setCurrentWeek(profile.pregnancyWeek);
            setCurrentDay(profile.pregnancyDay ?? 0);
            setDaysLeft(
              profile.dueDate ? calculateDaysUntilDueDate(profile.dueDate) : null,
            );

            setProfileState({ status: 'ready' });

            if (openCurrentWeek || (!didInitTrimesterFromProfile.current && !peekCalendarTrimester())) {
              const trimester = getTrimesterId(profile.pregnancyWeek);
              setSelectedTrimester(trimester);
              rememberCalendarTrimester(trimester);
              didInitTrimesterFromProfile.current = true;
              setFocusWeek(profile.pregnancyWeek);
            }
          } else {
            setCurrentWeek(null);
            setCurrentDay(null);
            setDaysLeft(null);
            setProfileState({ status: 'missing' });
          }
        } else {
          setCurrentWeek(null);
          setCurrentDay(null);
          setDaysLeft(null);
          setProfileState({ status: 'error', message: getErrorMessage(profileResult.reason) });
        }

        if (weeksResult.status === 'fulfilled') {
          const weeks = weeksResult.value.weeks;

          if (weeks.length === 0) {
            setWeeksState({ status: 'empty' });
          } else {
            setWeeksState({ status: 'ready', weeks });
          }

          return;
        }

        setWeeksState(mapWeeksFailure(weeksResult.reason));
      }

      void loadCalendarData();

      return () => {
        isActive = false;
      };
    }, [reloadKey]),
  );

  const visibleWeeks = useMemo(() => {
    if (weeksState.status !== 'ready') {
      return [];
    }

    const range = trimesterRanges[selectedTrimester];

    return weeksState.weeks.filter(
      (item) => item.week >= range.start && item.week <= range.end,
    );
  }, [selectedTrimester, weeksState]);

  useFocusEffect(
    useCallback(() => {
      if (focusWeek == null) {
        return;
      }

      const offset = weekOffsetsRef.current[focusWeek];
      if (typeof offset === 'number') {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: Math.max(offset - 24, 0), animated: false });
        });
      }
    }, [focusWeek, visibleWeeks]),
  );

  return (
    <Screen scroll={false} style={styles.container}>
      <View style={styles.fixedHeader}>

      <View style={styles.header}>
        <AppText variant="title">Календарь беременности</AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {currentWeek !== null
            ? `${formatWeeks(currentWeek)} • ${getTrimesterLabel(currentWeek)}`
            : 'Текущий срок пока неизвестен'}
        </AppText>
      </View>

      <View style={styles.segmentedControl}>
        {trimesterTabs.map((tab) => {
          const isSelected = selectedTrimester === tab.id;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={tab.id}
              onPress={() => selectTrimester(tab.id)}
              style={[styles.segmentButton, isSelected && styles.segmentButtonSelected]}
            >
              <AppText
                variant="bodySmall"
                color={isSelected ? colors.primary : colors.textSecondary}
                serif
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {currentWeek !== null ? <Card variant="muted" shadow="none" style={styles.summaryCard}>
        <AppText variant="caption" color={colors.textSecondary} uppercase>
          Сейчас
        </AppText>
        <AppText variant="cardTitle" color={colors.textPrimary} serif>
          {formatPregnancyTerm(currentWeek, currentDay ?? 0)}
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {getTrimesterLabel(currentWeek)}
          {daysLeft !== null ? ` • до родов примерно ${formatDays(daysLeft)}` : ''}
        </AppText>
        <ProgressBar
          value={currentWeek}
          max={42}
          height={8}
          fillColor={colors.primary}
          trackColor={colors.surface}
          style={styles.summaryProgress}
        />
        <Button
          title="Открыть чек-лист недели"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: '/tabs/more/checklists',
              params: {
                week: String(currentWeek),
                source: 'calendar',
                returnTo: '/tabs/calendar',
              },
            })
          }
        />
      </Card> : null}

      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.weekScroll}
        contentContainerStyle={styles.weekScrollContent}
        showsVerticalScrollIndicator={false}
      >
      {profileState.status === 'loading' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>Загружаем профиль беременности...</AppText>
        </Card>
      ) : null}
      {profileState.status === 'error' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState title="Не удалось загрузить срок беременности" description={profileState.message} actionTitle="Повторить" onActionPress={reloadCalendar} />
        </Card>
      ) : null}
      {profileState.status === 'missing' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState title="Профиль беременности не заполнен" description="Укажите срок, чтобы календарь выделил текущую неделю." actionTitle="Рассчитать срок" onActionPress={() => router.push('/setup/due-date')} />
        </Card>
      ) : null}

      {weeksState.status === 'loading' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем календарь...
          </AppText>
        </Card>
      ) : null}

      {weeksState.status === 'unavailable' || weeksState.status === 'error' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title={
              weeksState.status === 'unavailable'
                ? 'Сервер недоступен'
                : 'Не удалось загрузить календарь'
            }
            description={weeksState.message}
            actionTitle="Повторить"
            onActionPress={reloadCalendar}
          />
        </Card>
      ) : null}

      {weeksState.status === 'empty' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Контент календаря отсутствует"
            description="Недели беременности пока не найдены."
            actionTitle="Повторить"
            onActionPress={reloadCalendar}
          />
        </Card>
      ) : null}

      {weeksState.status === 'ready' ? (
        <View
          style={styles.weekList}
          onLayout={(event) => {
            weekListOffsetRef.current = event.nativeEvent.layout.y;
          }}
        >
          {visibleWeeks.map((week) => (
            <WeekCard
              key={week.week}
              week={week}
              currentWeek={currentWeek}
              currentDay={currentDay}
              selectedTrimester={selectedTrimester}
              highlighted={focusWeek === week.week}
              onLayoutY={(y) => {
                weekOffsetsRef.current[week.week] = weekListOffsetRef.current + y;
              }}
            />
          ))}
        </View>
      ) : null}

      </ScrollView>
    </Screen>
  );
}

type WeekCardProps = {
  week: PregnancyWeekSummary;
  currentWeek: number | null;
  currentDay: number | null;
  selectedTrimester: TrimesterId;
  highlighted: boolean;
  onLayoutY: (y: number) => void;
};

function WeekCard({
  week,
  currentWeek,
  currentDay,
  selectedTrimester,
  highlighted,
  onLayoutY,
}: WeekCardProps) {
  const isCurrent = currentWeek !== null && week.week === currentWeek;
  const isPast = currentWeek !== null && week.week < currentWeek;
  const currentTotalDays = currentWeek === null ? null : currentWeek * 7 + (currentDay ?? 0);
  const targetTotalDays = week.week * 7;
  const daysUntil = currentTotalDays === null ? null : Math.max(targetTotalDays - currentTotalDays, 0);
  const fruitImage = getFruitImage(week.fruitComparison);
  const fruitImageScale = getFruitImageScale(week.fruitComparison);
  const sizeLabel =
    week.fruitComparison ?? week.babySize ?? 'размер уточняется';

  return (
    <Pressable
      accessibilityLabel={`Открыть неделю ${week.week}`}
      accessibilityRole="button"
      onLayout={(event) => onLayoutY(event.nativeEvent.layout.y)}
      onPress={() => {
        rememberCalendarReturn(selectedTrimester, week.week);
        router.push({
          pathname: '/tabs/calendar/[week]',
          params: {
            week: String(week.week),
            fromTrimester: String(selectedTrimester),
          },
        });
      }}
      style={({ pressed }) => [
        styles.weekCard,
        isCurrent && styles.weekCardCurrent,
        highlighted && styles.weekCardFocused,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.weekNumber, isCurrent && styles.weekNumberCurrent]}>
        {fruitImage ? (
          <Image
            accessibilityIgnoresInvertColors
            source={fruitImage}
            resizeMode="contain"
            style={[
              styles.weekFruitImage,
              { margin: 6 },
              { transform: [{ scale: fruitImageScale }] },
            ]}
          />
        ) : (
          <AppText
            variant="body"
            color={isCurrent ? colors.white : colors.textSecondary}
            align="center"
          >
            {week.week}
          </AppText>
        )}
      </View>

      <View style={styles.weekContent}>
        <View style={styles.weekTitleRow}>
          <AppText
            variant="body"
            color={colors.textPrimary}
            serif
            style={styles.weekTitle}
          >
            {week.title}
          </AppText>
          {daysUntil === null ? null : isCurrent ? (
            <Pill label="Сейчас" tone="primary" style={styles.weekBadge} />
          ) : isPast ? (
            <Pill label="Прошла" tone="neutral" style={styles.weekBadge} />
          ) : (
            <Pill label={`Через ${formatDays(daysUntil)}`} tone="neutral" style={styles.weekBadge} />
          )}
        </View>

        <AppText variant="bodySmall" color={colors.textSecondary}>
          {hasFruitComparison(week.fruitComparison)
            ? `Как ${week.fruitComparison}`
            : `Размер: ${sizeLabel}`}
        </AppText>
        {week.babyWeight ? (
          <AppText variant="caption" color={colors.textMuted}>
            Вес {week.babyWeight}
          </AppText>
        ) : null}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={28}
        color={isCurrent ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
}

function mapWeeksFailure(error: unknown): WeeksLoadState {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        status: 'unavailable',
        message: error.message,
      };
    }

    return {
      status: 'error',
      message: error.message,
    };
  }

  return {
    status: 'error',
    message: getErrorMessage(error),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить календарь беременности.';
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
  fixedHeader: { gap: spacing.lg },
  weekScroll: { flex: 1, minHeight: 0 },
  weekScrollContent: { gap: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
  header: {
    gap: spacing.xs,
  },
  segmentedControl: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  stateCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  summaryCard: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  summaryProgress: {
    marginTop: spacing.sm,
  },
  weekList: {
    gap: spacing.lg,
  },
  weekCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 80,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.soft,
  },
  weekCardCurrent: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  weekCardFocused: {
    borderColor: colors.pink,
    borderWidth: 2,
  },
  weekNumber: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  weekNumberCurrent: {
    backgroundColor: colors.primary,
  },
  weekFruitImage: {
    height: 36,
    width: 36,
  },
  weekContent: {
    flex: 1,
    gap: spacing.xs,
  },
  weekTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekTitle: {
    flexShrink: 1,
  },
  weekBadge: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pressed: {
    opacity: 0.82,
  },
});
