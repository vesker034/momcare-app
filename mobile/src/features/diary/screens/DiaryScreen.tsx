import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Card, Screen } from '../../../shared/components';
import { createDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from '../../../services/api/diaryApi';
import { getErrorEntryId, getErrorStatus } from '../../../services/api/apiClient';
import { colors, radius, spacing } from '../../../shared/theme';
import { useDiaryForm } from '../hooks/useDiaryForm';
import { useDiaryEntries } from '../hooks/useDiaryEntries';
import {
  getDiaryMeasurementErrors,
  toCreateDiaryEntryRequest,
  toUpdateDiaryEntryRequest,
} from '../mappers/diaryMappers';
import { MoodSelector } from '../components/MoodSelector';
import { SymptomSelector } from '../components/SymptomSelector';
import { SleepSection } from '../components/SleepSection';
import { DailyTipCard } from '../components/DailyTipCard';
import { WaterTrackerCard } from '../components/WaterTrackerCard';
import { ReminderButton } from '../components/ReminderButton';
import { BodyMeasurements } from '../components/BodyMeasurements';
import { DiaryCalendarModal } from '../components/DiaryCalendarModal';
import { DiaryHistorySection } from '../components/DiaryHistorySection';
import type { MedicationStatus } from '../../../types/api';
import {
  addDays,
  formatFullDate,
  isSameDay,
  startOfDay,
  startOfMonth,
  toDateKey,
} from '../utils/diaryDates';

const medicationOptions: Array<{ id: MedicationStatus; label: string }> = [
  { id: 'ON_TIME', label: 'По плану' },
  { id: 'LATE', label: 'Позже запланированного' },
  { id: 'MISSED', label: 'Пропущено' },
  { id: 'NOT_APPLICABLE', label: 'Сегодня не требуется' },
];

const wellbeingLabels: Record<number, string> = {
  1: 'Очень плохо',
  2: 'Плохо',
  3: 'Нормально',
  4: 'Хорошо',
  5: 'Отлично',
};

const energyLabels: Record<number, string> = {
  1: 'Сил почти нет',
  2: 'Мало энергии',
  3: 'Средне',
  4: 'Достаточно энергии',
  5: 'Много энергии',
};

export function DiaryScreen() {

  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [calendarDay, setCalendarDay] = useState<Date>(() => startOfDay(new Date()));

  const {
    entries,
    isLoading: isLoadingEntries,
    error: entriesError,
    loadEntries,
    cancelPendingLoad,
    findEntryByDate,
  } = useDiaryEntries();

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savedOpacity = useRef(new Animated.Value(0)).current;
  const loadEntryRequestId = useRef(0);
  const {
    state: form,
    isDirty,
    setIsDirty,
    setWellbeingRating,
    setSleepHours,
    setSleepQuality,
    setEnergyLevel,
    setWaterMl,
    setMedicationStatus,
    setWeightKg,
    setBasalTemperatureC,
    setNote,
    setOtherSymptomText,
    toggleMood,
    toggleSymptom,
    toggleNoSymptoms,
    setSeverity,
    applyEntryToForm,
    resetForm,
    buildPayload,
  } = useDiaryForm();

  const measurementErrors = useMemo(
    () => getDiaryMeasurementErrors(form.weightKg, form.basalTemperatureC),
    [form.basalTemperatureC, form.weightKg],
  );

  const showSavedBanner = useCallback(() => {
    savedOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(savedOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(savedOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [savedOpacity]);

  const loadEntryForDate = useCallback(
    async (date: Date) => {
      const requestId = ++loadEntryRequestId.current;
      setSubmitError('');

      const list = await loadEntries();
      if (list === null || requestId !== loadEntryRequestId.current) {
        return;
      }
      const key = toDateKey(date);
      const entry = findEntryByDate(list, key);

      if (entry) {
        setSelectedEntryId(entry.id);
        applyEntryToForm(entry);
      } else {
        setSelectedEntryId(null);
        resetForm();
      }
      setIsDirty(false);
    },
    [loadEntries, findEntryByDate, applyEntryToForm, resetForm],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isDirty) {
        void loadEntryForDate(selectedDate);
      }

      return () => {
        loadEntryRequestId.current += 1;
        cancelPendingLoad();
      };
    }, [cancelPendingLoad, isDirty, loadEntryForDate, selectedDate]),
  );


  async function handleSave() {
    if (form.selectedMoods.length === 0) {
      setSubmitError('Выберите хотя бы одно настроение');
      return;
    }
    const measurementError =
      measurementErrors.weightKg ?? measurementErrors.basalTemperatureC;
    if (measurementError) {
      setSubmitError(measurementError);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    const { formValues, symptomsWithSeverity } = buildPayload();

    try {
      if (selectedEntryId) {
        const requestBase = toUpdateDiaryEntryRequest(formValues);
        const requestWithSeverity = {
          ...requestBase,
          symptoms: symptomsWithSeverity,
        };
        await updateDiaryEntry(selectedEntryId, requestWithSeverity);
      } else {
        const payload = toCreateDiaryEntryRequest(formValues);
        payload.date = toDateKey(selectedDate);
        payload.symptoms = symptomsWithSeverity;
        await createDiaryEntry(payload);
      }

      await loadEntryForDate(selectedDate);
      showSavedBanner();
    } catch (error: unknown) {
      const existingEntryId = getErrorEntryId(error);
      const status = getErrorStatus(error);

      if (status === 409 && existingEntryId) {
        try {
          const requestBase = toUpdateDiaryEntryRequest(formValues);
          const requestWithSeverity = {
            ...requestBase,
            symptoms: symptomsWithSeverity,
          };
          await updateDiaryEntry(existingEntryId, requestWithSeverity);
          await loadEntryForDate(selectedDate);
          showSavedBanner();
          return;
        } catch (updateError) {
          setSubmitError(getErrorMessage(updateError));
          return;
        }
      }

      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!selectedEntryId) return;

    Alert.alert(
      'Удалить запись?',
      'Запись дневника за эту дату будет удалена без восстановления.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
  }

  async function handleDelete() {
    if (!selectedEntryId) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await deleteDiaryEntry(selectedEntryId);
      await loadEntryForDate(selectedDate);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function requestDateChange(nextDate: Date) {
    if (isSameDay(nextDate, selectedDate)) return;
    if (nextDate > startOfDay(new Date())) return;

    const applyChange = () => {
      setSelectedDate(startOfDay(nextDate));
      setSelectedEntryId(null);
      resetForm();
      setIsDirty(false);
    };

    if (isDirty) {
      Alert.alert(
        'Несохранённые изменения',
        'Изменения за текущий день не сохранены. Перейти к другой дате без сохранения?',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Перейти', style: 'destructive', onPress: applyChange },
        ],
      );
      return;
    }

    applyChange();
  }

  function goToPreviousDay() {
    requestDateChange(addDays(selectedDate, -1));
  }

  function goToNextDay() {
    requestDateChange(addDays(selectedDate, 1));
  }

  function goToToday() {
    requestDateChange(startOfDay(new Date()));
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">Дневник самочувствия</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Как вы чувствуете себя сегодня?
        </AppText>

        <View style={styles.dateBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Предыдущий день"
            onPress={goToPreviousDay}
            style={styles.dateArrow}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Открыть календарь"
            onPress={() => {
              setCalendarMonth(startOfMonth(selectedDate));
              setCalendarDay(startOfDay(selectedDate));
              setIsCalendarOpen(true);
            }}
            style={styles.dateValue}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.primary} />
            <AppText variant="bodySmall" color={colors.primary} serif>
              {formatFullDate(selectedDate)}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Следующий день"
            disabled={isSameDay(selectedDate, new Date())}
            onPress={goToNextDay}
            style={[
              styles.dateArrow,
              isSameDay(selectedDate, new Date()) && styles.dateArrowDisabled,
            ]}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {!isSameDay(selectedDate, new Date()) ? (
          <Pressable
            accessibilityRole="button"
            onPress={goToToday}
            style={styles.todayButton}
          >
            <AppText variant="bodySmall" color={colors.primary} serif>
              Вернуться к сегодняшней дате
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formSection}>
          <AppText variant="label" color={colors.primary} uppercase>
            Общее самочувствие: {form.wellbeingRating}/5
          </AppText>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const isSelected = form.wellbeingRating === rating;
              return (
                <Pressable
                  key={rating}
                  onPress={() => setWellbeingRating(rating)}
                  style={styles.ratingColumn}
                >
                  <View
                    style={[
                      styles.ratingItem,
                      isSelected && styles.ratingItemSelected,
                    ]}
                  >
                    <AppText
                      variant="body"
                      color={isSelected ? colors.white : colors.textSecondary}
                    >
                      {rating}
                    </AppText>
                  </View>
                  <AppText
                    variant="caption"
                    align="center"
                    color={isSelected ? colors.primary : colors.textSecondary}
                    serif
                  >
                    {wellbeingLabels[rating]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <MoodSelector selectedMoods={form.selectedMoods} onToggle={toggleMood} />

        <SymptomSelector
          selectedSymptoms={form.selectedSymptoms}
          symptomSeverities={form.symptomSeverities}
          noSymptoms={form.noSymptoms}
          otherSymptomText={form.otherSymptomText}
          onToggle={toggleSymptom}
          onSetSeverity={setSeverity}
          onToggleNoSymptoms={toggleNoSymptoms}
          onOtherTextChange={setOtherSymptomText}
        />

        <SleepSection
          sleepHours={form.sleepHours}
          sleepQuality={form.sleepQuality}
          onSleepHoursChange={setSleepHours}
          onSleepQualityChange={setSleepQuality}
        />

        <View style={styles.metricCard}>
          <View style={styles.metricTitle}>
            <MaterialCommunityIcons
              name="lightning-bolt-outline"
              size={18}
              color={colors.primary}
            />
            <AppText variant="bodySmall" color={colors.primary} serif>
              Энергия: {form.energyLevel}/5
            </AppText>
          </View>

          <View style={styles.energyList}>
            {[1, 2, 3, 4, 5].map((level) => {
              const isSelected = form.energyLevel === level;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Энергия ${level} из 5: ${energyLabels[level]}`}
                  key={level}
                  onPress={() => setEnergyLevel(level)}
                  style={[
                    styles.energyItem,
                    isSelected && styles.energyItemSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.energyBadge,
                      isSelected && styles.energyBadgeSelected,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={isSelected ? colors.white : colors.primary}
                    >
                      {level}
                    </AppText>
                  </View>
                  <AppText
                    variant="caption"
                    color={isSelected ? colors.primary : colors.textSecondary}
                    serif
                  >
                    {energyLabels[level]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>




        <View style={styles.formSection}>
          <AppText variant="label" color={colors.primary} uppercase>
            Прием лекарств
          </AppText>

          <View style={styles.medicationList}>
            {medicationOptions.map((option) => {
              const isSelected = form.medicationStatus === option.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                  key={option.id}
                  onPress={() => setMedicationStatus(option.id)}
                  style={[
                    styles.medicationItem,
                    isSelected && styles.medicationItemSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.medicationRadio,
                      isSelected && styles.medicationRadioSelected,
                    ]}
                  >
                    {isSelected ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={colors.white}
                      />
                    ) : null}
                  </View>
                  <AppText
                    variant="bodySmall"
                    color={isSelected ? colors.primary : colors.textSecondary}
                    serif
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <ReminderButton />
        </View>

        <BodyMeasurements
          weightKg={form.weightKg}
          basalTemperatureC={form.basalTemperatureC}
          onWeightChange={setWeightKg}
          onBasalTemperatureChange={setBasalTemperatureC}
          weightError={measurementErrors.weightKg}
          basalTemperatureError={measurementErrors.basalTemperatureC}
        />

        <WaterTrackerCard
          waterMl={form.waterMl}
          onChange={setWaterMl}
          disabled={isSubmitting}
          showReminder
        />

        <View style={styles.formSection}>
          <AppText variant="label" color={colors.primary} uppercase>
            Заметка
          </AppText>
          <TextInput
            accessibilityLabel="Заметка"
            multiline
            onChangeText={setNote}
            placeholder="Что важно запомнить сегодня?"
            placeholderTextColor={colors.textMuted}
            style={styles.noteInput}
            textAlignVertical="top"
            value={form.note}
          />
        </View>


        <View style={styles.saveButtonWrapper}>
          <Button
            leftIcon={
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={22}
                color={colors.white}
              />
            }
            title={
              isSubmitting
                ? 'Сохраняем...'
                : selectedEntryId
                  ? 'Сохранить изменения'
                  : 'Сохранить самочувствие'
            }
            disabled={isSubmitting}
            onPress={handleSave}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.successBanner,
              { opacity: savedOpacity },
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.white} />
            <AppText variant="bodySmall" color={colors.white} serif>
              Сохранено
            </AppText>
          </Animated.View>
        </View>

        {selectedEntryId ? (
          <Button
            leftIcon={
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color={colors.primary}
              />
            }
            title="Удалить запись"
            variant="outline"
            disabled={isSubmitting}
            onPress={confirmDelete}
          />
        ) : null}

        {submitError ? (
          <AppText variant="bodySmall" color={colors.danger}>
            {submitError}
          </AppText>
        ) : null}
      </Card>

      <DiaryHistorySection
        entries={entries}
        isLoading={isLoadingEntries}
        error={entriesError}
        onSeeAll={() => router.push('/tabs/diary/all')}
      />

      <DailyTipCard />

      <DiaryCalendarModal
        visible={isCalendarOpen}
        calendarMonth={calendarMonth}
        calendarDay={calendarDay}
        onClose={() => setIsCalendarOpen(false)}
        onChangeMonth={setCalendarMonth}
        onChangeDay={setCalendarDay}
        onApply={(date) => {
          setIsCalendarOpen(false);
          requestDateChange(date);
        }}
      />
      <Card variant="muted" shadow="none" style={styles.disclaimerCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color={colors.textSecondary} />
        <AppText variant="caption" color={colors.textSecondary} serif>
          Информация в Mamelia носит справочный характер и не заменяет консультацию врача.
        </AppText>
      </Card>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  header: {
    gap: spacing.sm,
  },
  formCard: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  formSection: {
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flex: 1,
    gap: spacing.md,
    minHeight: 116,
    padding: spacing.lg,
  },
  metricTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  energyList: {
    gap: spacing.xs,
  },
  energyItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  energyItemSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
  energyBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  energyBadgeSelected: {
    backgroundColor: colors.primary,
  },
  noteInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 96,
    padding: spacing.lg,
  },

  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  ratingItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  ratingItemSelected: {
    backgroundColor: colors.primary,
  },
  ratingColumn: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  medicationList: {
    gap: spacing.xs,
  },
  medicationItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  medicationItemSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
  medicationRadio: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  medicationRadioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dateArrow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  dateArrowDisabled: {
    opacity: 0.4,
  },
  dateValue: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  todayButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRose,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  disclaimerCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  successBanner: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  saveButtonWrapper: {
    position: 'relative',
  },
});
