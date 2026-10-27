import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Input,
  Screen,
} from '../../../shared/components';
import {
  createPregnancyProfile,
  getPregnancyProfile,
  updatePregnancyProfile,
} from '../../../services/api/pregnancyProfileApi';
import { colors, radius, shadows, spacing } from '../../../shared/theme';
import type { PregnancyProfilePayload } from '../../../types/api';
import type { CalculationMethod } from '../utils/dateInput';

const profileAvatar = require('../../../../assets/images/profile-avatar.png');

type MethodOption = {
  id: CalculationMethod;
  title: string;
  subtitle: string;
  icon: 'calendar' | 'calendar-check' | 'human-pregnant';
};

const methodOptions: MethodOption[] = [
  {
    id: 'lastPeriod',
    title: 'По дате последней менструации',
    subtitle: 'Традиционный акушерский метод',
    icon: 'calendar',
  },
  {
    id: 'dueDate',
    title: 'По предполагаемой дате родов',
    subtitle: 'Если дата уже известна от врача',
    icon: 'calendar-check',
  },
  {
    id: 'currentWeek',
    title: 'По текущей неделе беременности',
    subtitle: 'Если вы уже знаете срок',
    icon: 'human-pregnant',
  },
];

const labelsByMethod: Record<CalculationMethod, string> = {
  lastPeriod: 'Дата первого дня последней менструации',
  dueDate: 'Предполагаемая дата родов',
  currentWeek: 'Текущая неделя беременности',
};

const placeholdersByMethod: Record<CalculationMethod, string> = {
  lastPeriod: 'дд.мм.гггг',
  dueDate: 'дд.мм.гггг',
  currentWeek: '24',
};

export function DueDateScreen() {
  const { height } = useWindowDimensions();
  const isCompact = height < 760;

  const [method, setMethod] = useState<CalculationMethod>('lastPeriod');
  const [values, setValues] = useState<Record<CalculationMethod, string>>({
    lastPeriod: '',
    dueDate: '',
    currentWeek: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const submittingRef = useRef(false);

  const activeValue = values[method];
  const keyboardType = 'number-pad';

  const inputMaxLength = useMemo(() => (method === 'currentWeek' ? 4 : 10), [method]);

  function updateValue(nextValue: string) {
    const formattedValue =
      method === 'currentWeek'
        ? formatWeekInput(nextValue)
        : formatDateInput(nextValue);

    setValues((currentValues) => ({
      ...currentValues,
      [method]: formattedValue,
    }));

    if (error) {
      setError('');
    }
  }

  function formatDateInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    if (digits.length <= 2) {
      return day;
    }

    if (digits.length <= 4) {
      return `${day}.${month}`;
    }

    return `${day}.${month}.${year}`;
  }

  function formatWeekInput(value: string) {
    return value;
  }

  function validateForm() {
    const trimmedValue = activeValue.trim();

    if (method === 'currentWeek') {
      if (!trimmedValue) {
        setError('Укажите текущую неделю беременности');
        return false;
      }

      const week = Number(trimmedValue);

      if (!/^\d+$/.test(trimmedValue) || !Number.isInteger(week) || week < 1 || week > 42) {
        setError('Неделя беременности должна быть от 1 до 42');
        return false;
      }

      const day = currentDay.trim() === '' ? 0 : Number(currentDay);
      if ((currentDay.trim() !== '' && !/^\d+$/.test(currentDay.trim())) ||
          !Number.isInteger(day) || day < 0 || day > 6) {
        setError('День текущей недели должен быть от 0 до 6');
        return false;
      }
      return true;
    }

    const validationResult = validateDateInput(trimmedValue, method);

    if (validationResult) {
      setError(validationResult);
      return false;
    }

    return true;
  }

  async function handleCalculate() {
    if (submittingRef.current) return;
    if (!validateForm()) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      const payload: PregnancyProfilePayload = method === 'currentWeek'
        ? { currentPregnancyWeek: Number(activeValue), currentPregnancyDay: Number(currentDay.trim() || '0') }
        : buildPregnancyProfilePayload(method, activeValue);
      const existingProfileResponse = await getPregnancyProfile();
      const response = existingProfileResponse.profile
        ? await updatePregnancyProfile(payload)
        : await createPregnancyProfile(payload);
      const profile = response.profile;

      if (!profile) {
        setError('Профиль беременности не был сохранён');
        return;
      }

      router.push('/setup/result');
    } catch (submitError) {
      setError(getSubmitErrorMessage(submitError));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Screen
      contentStyle={styles.scrollContent}
      style={[styles.container, isCompact && styles.compactContainer]}
    >
      <Header
        title="Расчет срока"
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад"
            onPress={() => router.back()}
          />
        }
        right={<Image source={profileAvatar} style={styles.avatar} />}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <AppText
            variant="subtitle"
            color={colors.primary}
            numberOfLines={1}
            serif
            style={styles.heroTitle}
          >
            Ваш путь начинается
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.heroText}>
            Давайте узнаем текущий срок вашей беременности
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" color={colors.primary} serif>
          Метод расчета
        </AppText>
        <View style={styles.methods}>
          {methodOptions.map((option) => (
            <MethodCard
              key={option.id}
              option={option}
              selected={method === option.id}
              onPress={() => {
                if (submittingRef.current) return;
                setMethod(option.id);
                setError('');
              }}
            />
          ))}
        </View>
      </View>

      <Input
        accessibilityLabel={labelsByMethod[method]}
        error={error}
        keyboardType={keyboardType}
        label={labelsByMethod[method]}
        maxLength={inputMaxLength}
        onChangeText={updateValue}
        placeholder={placeholdersByMethod[method]}
        shellStyle={styles.inputShell}
        value={activeValue}
        editable={!isSubmitting}
        variant="filled"
      />

      {method === 'currentWeek' ? (
        <Input
          accessibilityLabel="День текущей недели от 0 до 6"
          label="День текущей недели (0–6)"
          placeholder="0"
          keyboardType="number-pad"
          maxLength={4}
          value={currentDay}
          onChangeText={(value) => { setCurrentDay(value); setError(''); }}
          editable={!isSubmitting}
          variant="filled"
          shellStyle={styles.inputShell}
        />
      ) : null}

      <Card variant="muted" shadow="none" style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <AppText variant="caption" color={colors.primary} align="center">
            i
          </AppText>
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.infoText}>
          Обратите внимание, что расчет является приблизительным. Точный срок
          беременности и дату родов должен подтвердить ваш лечащий врач на основе
          УЗИ.
        </AppText>
      </Card>

      <Button
        rightIcon={<AppText variant="subtitle" color={colors.white}>›</AppText>}
        title={isSubmitting ? 'Сохраняем...' : 'Рассчитать'}
        disabled={isSubmitting}
        onPress={handleCalculate}
        style={styles.button}
      />
    </Screen>
  );
}

function buildPregnancyProfilePayload(
  method: Exclude<CalculationMethod, 'currentWeek'>,
  value: string,
): PregnancyProfilePayload {
  const apiDate = toApiDateString(value);

  if (method === 'lastPeriod') {
    return { lastMenstrualPeriod: apiDate };
  }

  return { dueDate: apiDate };
}

function toApiDateString(value: string) {
  const [day, month, year] = value.split('.');

  return `${year}-${month}-${day}`;
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось сохранить профиль беременности. Попробуйте ещё раз.';
}

function validateDateInput(value: string, method: CalculationMethod) {
  if (!value) {
    return 'Укажите дату';
  }

  if (value.length < 10) {
    return 'Введите дату полностью';
  }

  const dateParts = value.split('.');

  if (
    dateParts.length !== 3 ||
    !/^\d{2}$/.test(dateParts[0] ?? '') ||
    !/^\d{2}$/.test(dateParts[1] ?? '') ||
    !/^\d{4}$/.test(dateParts[2] ?? '')
  ) {
    return 'Введите дату в формате дд.мм.гггг';
  }

  const day = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const year = Number(dateParts[2]);

  if (day < 1 || day > 31) {
    return 'День должен быть от 01 до 31';
  }

  if (month < 1 || month > 12) {
    return 'Месяц должен быть от 01 до 12';
  }

  if (year < 1900 || year > 2100) {
    return 'Проверьте год';
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return 'Такой даты не существует';
  }

  if (method === 'lastPeriod' && parsedDate > new Date()) {
    return 'Дата последней менструации не может быть в будущем';
  }

  return '';
}

type MethodCardProps = {
  option: MethodOption;
  selected: boolean;
  onPress: () => void;
};

function MethodCard({ option, selected, onPress }: MethodCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.methodCard,
        selected && styles.methodCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.methodIcon, selected && styles.methodIconSelected]}>
        <MethodIcon name={option.icon} />
      </View>
      <View style={styles.methodText}>
        <AppText variant="bodySmall" color={colors.textPrimary} serif>
          {option.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {option.subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

type MethodIconProps = {
  name: MethodOption['icon'];
};

function MethodIcon({ name }: MethodIconProps) {
  const iconName =
    name === 'calendar'
      ? 'calendar-month-outline'
      : name === 'calendar-check'
        ? 'calendar-check-outline'
        : 'human-pregnant';

  return <MaterialCommunityIcons name={iconName} size={21} color={colors.primary} />;
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  compactContainer: {
    gap: spacing.lg,
  },
  avatar: {
    backgroundColor: colors.peach,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 42,
    width: 42,
  },
  heroCard: {
    backgroundColor: colors.peachSoft,
    borderRadius: radius.xl,
    borderColor: colors.pinkSoft,
    borderWidth: 2,
    height: 168,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 5,
  },
  heroCopy: {
    maxWidth: 300,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 21,
    lineHeight: 27,
  },
  heroText: {
    marginTop: spacing.xxs,
    maxWidth: 250,
  },
  section: {
    gap: spacing.md,
  },
  methods: {
    gap: spacing.md,
  },
  methodCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.xl,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  methodCardSelected: {
    backgroundColor: colors.backgroundWarm,
    borderColor: colors.primarySoft,
  },
  methodIcon: {
    alignItems: 'center',
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  methodIconSelected: {
    backgroundColor: colors.surfaceRose,
  },
  methodText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.78,
  },
  inputShell: {
    borderRadius: radius.pill,
    minHeight: 58,
    paddingHorizontal: spacing.xl,
  },
  infoCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  infoIcon: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    marginTop: spacing.xs,
    width: 22,
  },
  infoText: {
    flex: 1,
  },
  button: {
    marginTop: 'auto',
  },
});
