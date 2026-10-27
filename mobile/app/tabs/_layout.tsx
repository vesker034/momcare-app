import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { useAuth } from '../../src/features/auth/context/AuthContext';
import { requestCurrentCalendarWeek } from '../../src/features/calendar/data/calendarUiState';
import { colors, radius, spacing } from '../../src/shared/theme';

const tabLabels = {
  home: 'Главная',
  calendar: 'Календарь',
  diary: 'Дневник',
  doctor: 'Врач',
  more: 'Ещё',
} as const;

const tabIcons = {
  home: 'home-variant',
  calendar: 'calendar-month-outline',
  diary: 'book-open-page-variant',
  doctor: 'medical-bag',
  more: 'menu',
} as const;

export default function TabsLayout() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/welcome');
    }
  }, [status]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 88,
          paddingBottom: spacing.md,
          paddingTop: spacing.sm,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="home" options={tabOptions('home')} />
      <Tabs.Screen
        name="calendar"
        options={tabOptions('calendar')}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (!navigation.isFocused()) {
              requestCurrentCalendarWeek();
            }
          },
        })}
      />
      <Tabs.Screen name="diary" options={tabOptions('diary')} />
      <Tabs.Screen name="doctor" options={tabOptions('doctor')} />
      <Tabs.Screen name="more" options={tabOptions('more')} />
      <Tabs.Screen
        name="diary/all"
        options={{
          href: null,
          title: 'Все записи',
        }}
      />
      <Tabs.Screen
        name="diary/[entryId]"
        options={{
          href: null,
          title: 'Запись дневника',
        }}
      />
      <Tabs.Screen
        name="calendar/[week]"
        options={{
          href: null,
          title: 'Неделя',
        }}
      />
      <Tabs.Screen
        name="calendar/articles/[articleId]"
        options={{
          href: null,
          title: 'Статья',
        }}
      />
      <Tabs.Screen
        name="doctor/prepare"
        options={{
          href: null,
          title: 'Подготовка к визиту',
        }}
      />
      <Tabs.Screen
        name="doctor/report"
        options={{
          href: null,
          title: 'Отчёт для врача',
        }}
      />
      <Tabs.Screen
        name="doctor/question-new"
        options={{
          href: null,
          title: 'Добавить вопрос',
        }}
      />
      <Tabs.Screen
        name="doctor/questions/[questionId]"
        options={{
          href: null,
          title: 'Вопрос врачу',
        }}
      />
      <Tabs.Screen
        name="doctor/reports"
        options={{
          href: null,
          title: 'Все отчёты',
        }}
      />
      <Tabs.Screen
        name="more/profile"
        options={{
          href: null,
          title: 'Профиль',
        }}
      />
      <Tabs.Screen
        name="more/settings"
        options={{
          href: null,
          title: 'Настройки',
        }}
      />
      <Tabs.Screen
        name="more/nutrition"
        options={{
          href: null,
          title: 'Питание',
        }}
      />
      <Tabs.Screen
        name="more/activity"
        options={{
          href: null,
          title: 'Активность',
        }}
      />
      <Tabs.Screen
        name="more/checklists"
        options={{
          href: null,
          title: 'Чек-листы',
        }}
      />
      <Tabs.Screen
        name="more/knowledge"
        options={{
          href: null,
          title: 'База знаний',
        }}
      />
      <Tabs.Screen
        name="more/trackers"
        options={{
          href: null,
          title: 'Трекеры',
        }}
      />
      <Tabs.Screen
        name="more/documents"
        options={{
          href: null,
          title: 'Документы и анализы',
        }}
      />
      <Tabs.Screen
        name="more/favorites"
        options={{
          href: null,
          title: 'Избранное',
        }}
      />
      <Tabs.Screen
        name="more/support"
        options={{
          href: null,
          title: 'Помощь и поддержка',
        }}
      />
      <Tabs.Screen
        name="more/settings/language"
        options={{
          href: null,
          title: 'Язык приложения',
        }}
      />
      <Tabs.Screen
        name="more/settings/units"
        options={{
          href: null,
          title: 'Единицы измерения',
        }}
      />
      <Tabs.Screen
        name="more/settings/privacy"
        options={{
          href: null,
          title: 'Политика конфиденциальности',
        }}
      />
      <Tabs.Screen
        name="more/settings/terms"
        options={{
          href: null,
          title: 'Условия использования',
        }}
      />
      <Tabs.Screen
        name="more/settings/medical-disclaimer"
        options={{
          href: null,
          title: 'Медицинский дисклеймер',
        }}
      />
    </Tabs>
  );
}

type TabName = keyof typeof tabLabels;

function tabOptions(name: TabName) {
  return {
    title: tabLabels[name],
    tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean; size: number }) => {
      const iconColor = focused ? colors.primaryDark : String(color);

      return (
        <View style={[styles.tabIconWrapper, focused && styles.activeTab]}>
          <MaterialCommunityIcons
            name={tabIcons[name]}
            size={22}
            color={iconColor}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              { color: iconColor },
            ]}
          >
            {tabLabels[name]}
          </Text>
        </View>
      );
    },
  };
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    borderRadius: radius.lg,
    gap: spacing.xxs,
    justifyContent: 'center',
    minHeight: 58,
    minWidth: 72,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.pink,
  },
  tabText: {
    fontSize: 10,
    lineHeight: 15,
  },
});
