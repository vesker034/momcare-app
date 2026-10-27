import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import * as React from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  AppText,
  Card,
  Header,
  IconButton,
  Screen,
} from '../../../shared/components';
import { useAuth } from '../../auth/context/AuthContext';
import { colors, radius, shadows, spacing } from '../../../shared/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type NotificationKey = 'all' | 'visits' | 'water' | 'diary';
type ThemeChoice = 'light' | 'dark';

type NotificationOption = {
  id: NotificationKey;
  title: string;
  icon: IconName;
};

type SettingsRow = {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  route: string;
  external?: boolean;
};

const notificationOptions: NotificationOption[] = [
  { id: 'all', title: 'Все уведомления', icon: 'bell-outline' },
  { id: 'visits', title: 'Визиты к врачу', icon: 'calendar-check-outline' },
  { id: 'water', title: 'Напоминание о воде', icon: 'water-outline' },
  { id: 'diary', title: 'Записи в дневнике', icon: 'format-list-bulleted' },
];

const regionalRows: SettingsRow[] = [
  {
    id: 'language',
    title: 'Язык приложения',
    subtitle: 'Русский',
    icon: 'web',
    route: '/tabs/more/settings/language',
  },
  {
    id: 'units',
    title: 'Единицы измерения',
    subtitle: 'кг / см',
    icon: 'ruler',
    route: '/tabs/more/settings/units',
  },
];

const infoRows: SettingsRow[] = [
  {
    id: 'privacy',
    title: 'Политика конфиденциальности',
    icon: 'shield-account-outline',
    route: '/tabs/more/settings/privacy',
    external: true,
  },
  {
    id: 'terms',
    title: 'Условия использования',
    icon: 'file-document-outline',
    route: '/tabs/more/settings/terms',
    external: true,
  },
  {
    id: 'medical-disclaimer',
    title: 'Медицинский дисклеймер',
    icon: 'medical-bag',
    route: '/tabs/more/settings/medical-disclaimer',
    external: true,
  },
];

export function SettingsScreen() {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useNotificationSettings();
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeChoice>('light');

  function handleLogout() {
    Alert.alert('Выйти из аккаунта?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          void logout().finally(() => router.replace('/welcome'));
        },
      },
    ]);
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Настройки"
        left={
          <IconButton
            icon={<MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />}
            label="Назад к экрану Ещё"
            onPress={() => router.push('/tabs/more')}
          />
        }
      />

      <Card variant="rose" shadow="none" style={styles.heroCard}>
        <AppText variant="subtitle" color={colors.primaryDark}>
          Персонализация
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Управляйте уведомлениями, внешним видом и приватностью
        </AppText>
      </Card>

      <View style={styles.section}>
        <SectionLabel title="Уведомления" />
        <Card padded={false} shadow="none" variant="muted" style={styles.softListCard}>
          {notificationOptions.map((option) => (
            <NotificationRow
              key={option.id}
              option={option}
              value={notifications[option.id]}
              onValueChange={() => setNotifications(option.id)}
            />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel title="Региональные настройки" />
        <Card padded={false} shadow="none" variant="muted" style={styles.softListCard}>
          {regionalRows.map((item) => (
            <SettingsListRow item={item} key={item.id} />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel title="Внешний вид" />
        <View style={styles.themeRow}>
          <ThemeCard
            label="Светлая"
            selected={selectedTheme === 'light'}
            tone="light"
            onPress={() => setSelectedTheme('light')}
          />
          <ThemeCard
            label="Тёмная"
            selected={selectedTheme === 'dark'}
            tone="dark"
            onPress={() => setSelectedTheme('dark')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel title="Информация" />
        <Card padded={false} shadow="none" variant="muted" style={styles.softListCard}>
          {infoRows.map((item) => (
            <SettingsListRow item={item} key={item.id} />
          ))}
          <View style={styles.logoutDivider} />
          <Pressable
            accessibilityLabel="Выйти из аккаунта"
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            <AppText variant="button" color={colors.danger} align="center">
              Выйти из аккаунта
            </AppText>
          </Pressable>
        </Card>
      </View>

      <View style={styles.footer}>
        <View style={styles.logo}>
          <MaterialCommunityIcons
            name="face-woman-shimmer-outline"
            size={26}
            color={colors.white}
          />
        </View>
        <AppText variant="bodySmall" color={colors.textMuted} align="center">
          Mamelia v0.0.0
        </AppText>
        <AppText variant="caption" color={colors.textMuted} align="center">
          С любовью для мам
        </AppText>
      </View>
    </Screen>
  );
}

function useNotificationSettings() {
  const [notifications, setNotificationState] = React.useState<Record<NotificationKey, boolean>>({
    all: true,
    visits: true,
    water: true,
    diary: false,
  });

  function setNotifications(key: NotificationKey) {
    setNotificationState((current) => {
      if (key === 'all') {
        const nextAll = !current.all;

        return {
          all: nextAll,
          visits: nextAll,
          water: nextAll,
          diary: nextAll,
        };
      }

      const next = {
        ...current,
        [key]: !current[key],
      };
      const allDetailsEnabled = next.visits && next.water && next.diary;

      return {
        ...next,
        all: allDetailsEnabled,
      };
    });
  }

  return [notifications, setNotifications] as const;
}

type SectionLabelProps = {
  title: string;
};

function SectionLabel({ title }: SectionLabelProps) {
  return (
    <AppText variant="label" color={colors.primary} uppercase>
      {title}
    </AppText>
  );
}

type NotificationRowProps = {
  option: NotificationOption;
  value: boolean;
  onValueChange: () => void;
};

function NotificationRow({ option, value, onValueChange }: NotificationRowProps) {
  return (
    <Pressable
      accessibilityLabel={option.title}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={onValueChange}
      style={styles.notificationRow}
    >
      <MaterialCommunityIcons name={option.icon} size={24} color={colors.primary} />
      <AppText variant="bodySmall" style={styles.rowTitle}>
        {option.title}
      </AppText>
      <Switch
        onValueChange={onValueChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </Pressable>
  );
}

type SettingsListRowProps = {
  item: SettingsRow;
};

function SettingsListRow({ item }: SettingsListRowProps) {
  return (
    <Pressable
      accessibilityLabel={item.title}
      accessibilityRole="button"
      onPress={() => router.push(item.route)}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
      <View style={styles.rowCopy}>
        <AppText variant="bodySmall">{item.title}</AppText>
        {item.subtitle ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {item.subtitle}
          </AppText>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name={item.external ? 'open-in-new' : 'chevron-right'}
        size={24}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

type ThemeCardProps = {
  label: string;
  selected: boolean;
  tone: ThemeChoice;
  onPress: () => void;
};

function ThemeCard({ label, selected, tone, onPress }: ThemeCardProps) {
  return (
    <Pressable
      accessibilityLabel={`Тема ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeCard,
        selected && styles.themeCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.themePreview, tone === 'dark' && styles.themePreviewDark]}>
        <View style={[styles.previewPanel, tone === 'dark' && styles.previewPanelDark]} />
        <View style={[styles.previewLine, tone === 'dark' && styles.previewLineDark]} />
      </View>
      <AppText
        variant="bodySmall"
        color={selected ? colors.primary : colors.textPrimary}
        serif
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: 70,
    paddingTop: spacing.sm,
  },
  heroCard: {
    borderColor: 'transparent',
    gap: spacing.xs,
    marginTop: spacing.xl,
    minHeight: 126,
    padding: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  softListCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    overflow: 'hidden',
    paddingVertical: spacing.sm,
  },
  notificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.xl,
  },
  rowTitle: {
    flex: 1,
  },
  listRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.xl,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  themeCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.xl,
    borderWidth: 2,
    gap: spacing.md,
    minHeight: 148,
    padding: spacing.lg,
    width: 122,
  },
  themeCardSelected: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  themePreview: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.xs,
    borderWidth: 1,
    height: 78,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 84,
  },
  themePreviewDark: {
    backgroundColor: colors.surfaceMuted,
  },
  previewPanel: {
    backgroundColor: colors.surface,
    height: 36,
  },
  previewPanelDark: {
    backgroundColor: colors.border,
  },
  previewLine: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 7,
    marginHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  previewLineDark: {
    backgroundColor: colors.textMuted,
  },
  logoutDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: colors.danger,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl,
    minHeight: 54,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 52,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.76,
  },
});
