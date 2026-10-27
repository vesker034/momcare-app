import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../../../shared/components';
import { colors, radius, shadows, spacing } from '../../../shared/theme';
import { useAuth } from '../../auth/context/AuthContext';
import {
  appItems,
  moreTools,
  myDataItems,
  type MoreListItem,
  type MoreTool,
} from '../data/moreMockData';

export function MoreScreen() {
  const { user } = useAuth();
  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">Ещё</AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Разделы и настройки
        </AppText>
      </View>

      <Pressable
        accessibilityLabel="Открыть профиль"
        accessibilityRole="button"
        onPress={() => router.push('/tabs/more/profile')}
        style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
      >
        <View style={styles.profileGlow} />
        <View style={styles.profileCopy}>
          <AppText variant="subtitle" color={colors.primaryDark}>
            {user?.name?.trim() || 'Пользователь'}
          </AppText>
          <AppText variant="bodySmall" color={colors.primaryDark}>
            Мой профиль
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Редактировать профиль"
          accessibilityRole="button"
          onPress={() => router.push('/tabs/more/profile')}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </Pressable>

      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary} uppercase>
          Инструменты и здоровье
        </AppText>
        <View style={styles.toolsGrid}>
          {moreTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary} uppercase>
          Мои данные
        </AppText>
        <Card padded={false} shadow="soft" style={styles.listCard}>
          {myDataItems.map((item, index) => (
            <MoreRow
              item={item}
              key={item.id}
              showDivider={index < myDataItems.length - 1}
            />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary} uppercase>
          Приложение
        </AppText>
        <Card padded={false} shadow="soft" style={styles.listCard}>
          {appItems.map((item, index) => (
            <MoreRow
              item={item}
              key={item.id}
              showDivider={index < appItems.length - 1}
            />
          ))}
        </Card>
      </View>

      <AppText
        align="center"
        color={colors.textMuted}
        style={styles.quote}
        variant="caption"
      >
        «Материнство — это единственное место, где можно испытать и рай, и ад одновременно»
      </AppText>
    </Screen>
  );
}

type ToolCardProps = {
  tool: MoreTool;
};

function ToolCard({ tool }: ToolCardProps) {
  return (
    <Pressable
      accessibilityLabel={tool.title}
      accessibilityRole="button"
      onPress={() => router.push(tool.route)}
      style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
    >
      <View style={[styles.toolIcon, styles[`${tool.tone}Icon`]]}>
        <MaterialCommunityIcons
          name={tool.icon}
          size={30}
          color={tool.tone === 'lavender' ? colors.secondary : colors.primary}
        />
      </View>
      <AppText variant="bodySmall" align="center">
        {tool.title}
      </AppText>
    </Pressable>
  );
}

type MoreRowProps = {
  item: MoreListItem;
  showDivider: boolean;
};

function MoreRow({ item, showDivider }: MoreRowProps) {
  return (
    <Pressable
      accessibilityLabel={item.title}
      accessibilityRole="button"
      onPress={() => router.push(item.route)}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.rowDivider,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={24}
        color={colors.primary}
      />
      <AppText variant="bodySmall" style={styles.rowTitle}>
        {item.title}
      </AppText>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.textSecondary}
      />
    </Pressable>
  );
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
  header: {
    gap: spacing.xs,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 124,
    overflow: 'hidden',
    padding: spacing.xl,
    ...shadows.soft,
  },
  profileGlow: {
    backgroundColor: colors.peach,
    borderRadius: radius.xxl,
    bottom: -34,
    height: 132,
    opacity: 0.62,
    position: 'absolute',
    right: -18,
    width: 176,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  section: {
    gap: spacing.md,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  toolCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    minHeight: 124,
    padding: spacing.lg,
    width: '47%',
    ...shadows.none,
  },
  toolIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  peachIcon: {
    backgroundColor: colors.accentSoft,
  },
  lavenderIcon: {
    backgroundColor: colors.lavenderSoft,
  },
  roseIcon: {
    backgroundColor: colors.pinkSoft,
  },
  listCard: {
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
  },
  rowDivider: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
  },
  rowTitle: {
    flex: 1,
  },
  quote: {
    fontStyle: 'italic',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.76,
  },
});
