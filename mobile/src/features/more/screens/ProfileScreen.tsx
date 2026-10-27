import { formatPregnancyTerm } from '../../../shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  Header,
  IconButton,
  Input,
  Screen,
} from '../../../shared/components';
import { useAuth } from '../../auth/context/AuthContext';
import { getPregnancyProfile } from '../../../services/api/pregnancyProfileApi';
import { updateCurrentUser } from '../../../services/api/usersApi';
import { colors, radius, shadows, spacing } from '../../../shared/theme';
import type { PregnancyProfile } from '../../../types/api';

const profileAvatar = require('../../../../assets/images/profile-avatar.png');

export function ProfileScreen() {
  const { logout, user, updateUser } = useAuth();
  const [draftName, setDraftName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const savingNameRef = useRef(false);
  const [isEditingPersonalData, setIsEditingPersonalData] = useState(false);
  const [pregnancyProfile, setPregnancyProfile] = useState<PregnancyProfile | null>(null);
  const [isPregnancyProfileLoading, setIsPregnancyProfileLoading] = useState(true);
  const [pregnancyProfileError, setPregnancyProfileError] = useState('');

  useFocusEffect(useCallback(() => {
    let isMounted = true;

    async function loadPregnancyProfile() {
      setIsPregnancyProfileLoading(true);
      setPregnancyProfileError('');

      try {
        const response = await getPregnancyProfile();

        if (isMounted) {
          setPregnancyProfile(response.profile);
        }
      } catch (error) {
        if (isMounted) {
          setPregnancyProfileError(getProfileErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsPregnancyProfileLoading(false);
        }
      }
    }

    void loadPregnancyProfile();

    return () => {
      isMounted = false;
    };
  }, []));

  function startEditingPersonalData() {
    if (savingNameRef.current) return;
    setDraftName(user?.name ?? '');
    setNameError('');
    setIsEditingPersonalData(true);
  }

  function cancelEditingPersonalData() {
    if (savingNameRef.current) return;
    setNameError('');
    setIsEditingPersonalData(false);
  }

  async function savePersonalData() {
    if (savingNameRef.current) return;
    const name = draftName.trim();
    if (name.length < 2 || name.length > 60) {
      setNameError('Имя должно содержать от 2 до 60 символов.');
      return;
    }
    savingNameRef.current = true;
    setIsSavingName(true);
    setNameError('');
    try {
      const response = await updateCurrentUser(name);
      updateUser(response.user);
      setIsEditingPersonalData(false);
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Не удалось сохранить имя.');
    } finally {
      savingNameRef.current = false;
      setIsSavingName(false);
    }
  }

  function showDueDateInfo() {
    Alert.alert(
      'Информация о дате родов',
      'Точная дата родов может отличаться и обычно уточняется врачом по результатам осмотра и УЗИ.',
      [{ text: 'Понятно' }],
    );
  }

  function handleLogout() {
    Alert.alert(
      'Выйти из аккаунта?',
      'Вы сможете снова войти в свой аккаунт позже.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: () => {
            void logout().finally(() => router.replace('/welcome'));
          },
        },
      ],
    );
  }

  const pregnancyTermLabel = pregnancyProfile
    ? formatPregnancyTerm(pregnancyProfile.pregnancyWeek ?? 0, pregnancyProfile.pregnancyDay ?? 0)
    : 'Срок не указан';

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Профиль"
        right={<View />}
        left={
          <IconButton
            icon={<MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />}
            label="Назад к экрану Ещё"
            onPress={() => router.push('/tabs/more')}
          />
        }
      />

      <View style={styles.profileHero}>
        <View style={styles.avatarWrap}>
          <Image source={profileAvatar} style={styles.avatar} resizeMode="cover" />
          <Pressable
            accessibilityLabel="Редактировать профиль"
            accessibilityRole="button"
            onPress={startEditingPersonalData}
            style={({ pressed }) => [styles.avatarEdit, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="pencil" size={22} color={colors.white} />
          </Pressable>
        </View>
        <AppText variant="subtitle">{user?.name?.trim() || 'Пользователь'}</AppText>
        <View style={styles.weekBadge}>
          <MaterialCommunityIcons name="heart" size={17} color={colors.primaryDark} />
          <AppText variant="label" color={colors.primaryDark} uppercase>
            {pregnancyTermLabel}
          </AppText>
        </View>
      </View>

      <Card style={styles.infoCard}>
        <CardTitle icon="account-outline" title="Личные данные" />
        <View style={styles.divider} />
        {isEditingPersonalData ? (
          <>
            <Input
              label="Имя"
              value={draftName}
              onChangeText={setDraftName}
              editable={!isSavingName}
              placeholder="Ваше имя"
              variant="filled"
            />
            <DataField label="Email" value={user?.email || 'Не указан'} />
            {nameError ? (
              <AppText variant="bodySmall" color={colors.danger} accessibilityRole="alert">
                {nameError}
              </AppText>
            ) : null}
            <View style={styles.editActions}>
              <Pressable
                accessibilityLabel="Отменить изменение личных данных"
                accessibilityRole="button"
                onPress={cancelEditingPersonalData}
                disabled={isSavingName}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <AppText variant="bodySmall" color={colors.primary}>
                  Отмена
                </AppText>
              </Pressable>
              <Pressable
                accessibilityLabel="Сохранить личные данные"
                accessibilityRole="button"
                onPress={() => void savePersonalData()}
                disabled={isSavingName}
                accessibilityState={{ disabled: isSavingName, busy: isSavingName }}
                style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              >
                <AppText variant="bodySmall" color={colors.white}>
                  {isSavingName ? 'Сохраняем...' : 'Сохранить'}
                </AppText>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <DataField label="Email" value={user?.email || 'Не указан'} />
            <View style={styles.dividerSoft} />
            <Pressable
              accessibilityLabel="Изменить личные данные"
              accessibilityRole="button"
              onPress={startEditingPersonalData}
              style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
            >
              <AppText variant="bodySmall" color={colors.primary}>
                Изменить личные данные
              </AppText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.primary}
              />
            </Pressable>
          </>
        )}
      </Card>

      <Card style={styles.infoCard}>
        <CardTitle icon="calendar-month-outline" title="Данные беременности" />
        <View style={styles.divider} />
        {isPregnancyProfileLoading ? (
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем данные беременности...
          </AppText>
        ) : null}
        {!isPregnancyProfileLoading && pregnancyProfileError ? (
          <AppText variant="bodySmall" color={colors.danger}>
            {pregnancyProfileError}
          </AppText>
        ) : null}
        {!isPregnancyProfileLoading && !pregnancyProfileError && pregnancyProfile ? (
          <>
            <View style={styles.fieldRow}>
              <DataField
                label="Предполагаемая дата родов"
                value={formatDate(pregnancyProfile.dueDate)}
                compact
              />
              <IconButton
                icon={<MaterialCommunityIcons name="information-outline" size={23} color={colors.primary} />}
                label="Информация о дате родов"
                onPress={showDueDateInfo}
              />
            </View>
            <DataField
              label="Текущий срок"
              value={pregnancyTermLabel}
            />
            <DataField
              label="Триместр"
              value={formatTrimester(pregnancyProfile.trimester)}
            />
          </>
        ) : null}
        {!isPregnancyProfileLoading && !pregnancyProfileError && !pregnancyProfile ? (
          <DataField
            label="Профиль беременности"
            value="Пока не заполнен"
          />
        ) : null}
        <View style={styles.dividerSoft} />
        <Pressable
          accessibilityLabel="Изменить данные беременности"
          accessibilityRole="button"
          onPress={() => router.push('/setup/due-date')}
          style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
        >
          <AppText variant="bodySmall" color={colors.primary}>
            Изменить данные беременности
          </AppText>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </Card>

      <View style={styles.section}>
        <AppText variant="bodySmall" color={colors.textSecondary} serif>
          Настройки приложения
        </AppText>
        <Pressable
          accessibilityLabel="Открыть настройки"
          accessibilityRole="button"
          onPress={() => router.push('/tabs/more/settings')}
          style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="cog-outline" size={26} color={colors.textSecondary} />
          <AppText variant="bodySmall" style={styles.settingsTitle}>
            Настройки
          </AppText>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.border}
          />
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel="Выйти из аккаунта"
        accessibilityRole="button"
        onPress={handleLogout}
        style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="logout" size={22} color={colors.danger} />
        <AppText variant="caption" color={colors.danger}>
          Выйти из аккаунта
        </AppText>
      </Pressable>

      <AppText variant="bodySmall" color={colors.textMuted} align="center" style={styles.footer}>
        Mamelia v0.0.0
      </AppText>
    </Screen>
  );
}

type CardTitleProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
};

function CardTitle({ icon, title }: CardTitleProps) {
  return (
    <View style={styles.cardTitle}>
      <MaterialCommunityIcons name={icon} size={25} color={colors.primary} />
      <AppText variant="cardTitle">{title}</AppText>
    </View>
  );
}

type DataFieldProps = {
  label: string;
  value: string;
  compact?: boolean;
};

function DataField({ label, value, compact = false }: DataFieldProps) {
  return (
    <View style={[styles.dataField, compact && styles.compactField]}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body" color={colors.textPrimary}>
        {value}
      </AppText>
    </View>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
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

function getProfileErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить профиль беременности.';
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: 122,
    paddingTop: spacing.sm,
  },
  profileHero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: colors.peach,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 5,
    height: 132,
    width: 132,
    ...shadows.soft,
  },
  avatarEdit: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 3,
    bottom: 2,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    width: 44,
  },
  weekBadge: {
    alignItems: 'center',
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 30,
    paddingHorizontal: spacing.lg,
  },
  infoCard: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  cardTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
  },
  dividerSoft: {
    backgroundColor: colors.borderSoft,
    height: 1,
    marginTop: spacing.xs,
  },
  dataField: {
    gap: spacing.xxs,
  },
  compactField: {
    flex: 1,
  },
  fieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  textAction: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  settingsRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  settingsTitle: {
    flex: 1,
  },
  logout: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  footer: {
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.76,
  },
});
