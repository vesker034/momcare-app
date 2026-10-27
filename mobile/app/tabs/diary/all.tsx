import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import {
  AppText,
  Card,
  EmptyState,
  Header,
  IconButton,
  Screen,
} from '../../../src/shared/components';
import {
  getDiaryEntriesByDateRange,
} from '../../../src/services/api/diaryApi';
import { colors, radius, spacing } from '../../../src/shared/theme';
import {
  formatDiaryDate,
  getMoodEmojis,
} from '../../../src/features/diary/mappers/diaryMappers';
import type { DiaryEntry } from '../../../src/types/api';
import {
  addMonths,
  endOfMonth,
  formatMonthTitle,
  getMonthMatrix,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  toDateKey,
  weekdayShort,
} from '../../../src/features/diary/utils/diaryDates';

export default function AllDiaryEntriesScreen() {
  const [monthEntries, setMonthEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const requestIdRef = useRef(0);

  const loadMonthEntries = useCallback(async (month: Date) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError('');

    try {
      const response = await getDiaryEntriesByDateRange(
        toDateKey(startOfMonth(month)),
        toDateKey(endOfMonth(month)),
      );
      const list = Array.isArray(response?.entries) ? response.entries : [];
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (requestId === requestIdRef.current) {
        setMonthEntries(list);
      }
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setMonthEntries([]);
        setError(getErrorMessage(loadError));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const markedDates = useMemo(
    () => new Set(monthEntries.map((entry) => entry.date)),
    [monthEntries],
  );
  const entries = useMemo(
    () => selectedDate
      ? monthEntries.filter((entry) => entry.date === toDateKey(selectedDate))
      : monthEntries,
    [monthEntries, selectedDate],
  );
  const calendarWeeks = useMemo(() => {
    const days = getMonthMatrix(calendarMonth);
    return Array.from({ length: 6 }, (_, weekIndex) =>
      days.slice(weekIndex * 7, weekIndex * 7 + 7),
    );
  }, [calendarMonth]);

  useFocusEffect(
    useCallback(() => {
      const currentMonth = startOfMonth(new Date());
      setCalendarMonth(currentMonth);
      setSelectedDate(null);
      void loadMonthEntries(currentMonth);

      return () => {
        requestIdRef.current += 1;
      };
    }, [loadMonthEntries]),
  );

  function handleChangeMonth(month: Date) {
    const normalizedMonth = startOfMonth(month);
    setSelectedDate(null);
    setCalendarMonth(normalizedMonth);
    void loadMonthEntries(normalizedMonth);
  }

  function handleSelectDate(day: Date) {
    const today = startOfDay(new Date());
    if (day > today) return;
    setSelectedDate(startOfDay(day));
  }

  function handleSelectAll() {
    setSelectedDate(null);
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Все записи"
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад"
            onPress={() => router.replace('/tabs/diary')}
          />
        }
      />

      <Card variant="muted" shadow="none" style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Предыдущий месяц"
            onPress={() => handleChangeMonth(addMonths(calendarMonth, -1))}
            style={styles.calendarArrow}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
          </Pressable>

          <AppText variant="cardTitle">{formatMonthTitle(calendarMonth)}</AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Следующий месяц"
            onPress={() => {
              const next = addMonths(calendarMonth, 1);
              if (next <= startOfMonth(new Date())) {
                handleChangeMonth(next);
              }
            }}
            disabled={addMonths(calendarMonth, 1) > startOfMonth(new Date())}
            style={[
              styles.calendarArrow,
              addMonths(calendarMonth, 1) > startOfMonth(new Date()) &&
              styles.calendarArrowDisabled,
            ]}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.calendarWeekdays}>
          {weekdayShort.map((label) => (
            <View key={label} style={styles.calendarWeekdayCell}>
              <AppText variant="caption" color={colors.textSecondary} align="center">
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarWeeks.map((week) => (
            <View key={toDateKey(week[0])} style={styles.calendarWeek}>
              {week.map((day) => {
                const today = startOfDay(new Date());
                const isFuture = day > today;
                const isOutsideMonth = !isSameMonth(day, calendarMonth);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const hasEntry = markedDates.has(toDateKey(day));

                return (
                  <Pressable
                    key={toDateKey(day)}
                    disabled={isFuture || isOutsideMonth}
                    onPress={() => handleSelectDate(day)}
                    style={[
                      styles.calendarDayCell,
                      isSelected && styles.calendarDaySelected,
                      isToday && !isSelected && styles.calendarDayToday,
                      isOutsideMonth && styles.calendarDayOutside,
                      isFuture && styles.calendarDayDisabled,
                    ]}
                  >
                    <AppText
                      variant="bodySmall"
                      align="center"
                      color={
                        isFuture || isOutsideMonth
                          ? colors.textMuted
                          : isSelected
                            ? colors.white
                            : colors.textPrimary
                      }
                    >
                      {day.getDate()}
                    </AppText>
                    {hasEntry ? (
                      <View
                        style={[
                          styles.calendarDot,
                          isSelected && styles.calendarDotSelected,
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {selectedDate ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleSelectAll}
            style={styles.showAllButton}
          >
            <AppText variant="bodySmall" color={colors.primary} serif>
              Показать все записи
            </AppText>
          </Pressable>
        ) : null}
      </Card>

      {isLoading ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем записи дневника...
          </AppText>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.danger}>
            {error}
          </AppText>
        </Card>
      ) : null}

      {!isLoading && !error && entries.length === 0 ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title={selectedDate ? 'Записи нет' : 'Записей пока нет'}
            description={
              selectedDate
                ? `На ${formatDiaryDate(toDateKey(selectedDate))} записи нет.`
                : `За ${formatMonthTitle(calendarMonth).toLowerCase()} записей нет.`
            }
          />
        </Card>
      ) : null}

      {!isLoading && !error && entries.length > 0 ? (
        <View style={styles.entries}>
          {entries.map((entry) => (
            <Pressable
              accessibilityLabel="Открыть запись дневника"
              accessibilityRole="button"
              key={entry.id || entry.date}
              onPress={() =>
                router.push({
                  pathname: '/tabs/diary/[entryId]',
                  params: {
                    entryId: entry.id,
                    returnTo: '/tabs/diary/all',
                  },
                })
              }
              style={({ pressed }) => [styles.entryCard, pressed && styles.pressed]}
            >
              <View style={styles.entryIcon}>
                <AppText style={styles.emojiText}>
                  {getMoodEmojis(entry.moods)[0] ?? '😐'}
                </AppText>
              </View>
              <View style={styles.entryCopy}>
                <AppText variant="body" color={colors.textPrimary} serif>
                  {entry.note || 'Запись самочувствия'}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {formatDiaryDate(entry.date)} • Сон {formatSleepHours(entry.sleepHours)}ч • Энергия {entry.energyLevel}/5
                </AppText>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function formatSleepHours(value: number | null | undefined) {
  if (value === null || value === undefined) return 'не указано';
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Не удалось загрузить записи дневника.';
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: {
    gap: spacing.xl,
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  stateCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  entries: { gap: spacing.md },
  entryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 82,
    padding: spacing.lg,
  },
  entryIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emojiText: { fontSize: 22 },
  entryCopy: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.76 },

  calendarCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  calendarArrow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  calendarArrowDisabled: { opacity: 0.4 },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  calendarWeekdayCell: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  calendarGrid: {
    width: '100%',
  },
  calendarWeek: {
    flexDirection: 'row',
    width: '100%',
  },
  calendarDayCell: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    height: 44,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayToday: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  calendarDayDisabled: { opacity: 0.4 },
  calendarDayOutside: { opacity: 0.32 },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  calendarDotSelected: { backgroundColor: colors.white },
  showAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
