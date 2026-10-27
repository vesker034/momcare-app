import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, EmptyState } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { checklistCategoryLabels } from '../mappers/calendarMappers';
import type { ChecklistItem } from '../../../types/api';

type ChecklistItemsPanelProps = {
  items: ChecklistItem[];
  isLoading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  togglingItemId?: string | null;
  onToggle: (id: string) => void;
  onEditPersonal?: (item: ChecklistItem) => void;
  onDeletePersonal?: (item: ChecklistItem) => void;
};

export function ChecklistItemsPanel({
  items,
  isLoading = false,
  error = '',
  emptyTitle = 'Чек-лист пуст',
  emptyDescription = 'Для этой недели пока нет пунктов чек-листа.',
  togglingItemId = null,
  onToggle,
  onEditPersonal,
  onDeletePersonal,
}: ChecklistItemsPanelProps) {
  if (isLoading) {
    return (
      <AppText variant="bodySmall" color={colors.textSecondary}>
        Загружаем чек-лист...
      </AppText>
    );
  }

  if (error) {
    return (
      <AppText variant="bodySmall" color={colors.danger}>
        {error}
      </AppText>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <ChecklistRow
          key={item.id}
          item={item}
          disabled={togglingItemId === item.id}
          onToggle={onToggle}
          onEditPersonal={onEditPersonal}
          onDeletePersonal={onDeletePersonal}
        />
      ))}
    </View>
  );
}

type ChecklistRowProps = {
  item: ChecklistItem;
  disabled: boolean;
  onToggle: (id: string) => void;
  onEditPersonal?: (item: ChecklistItem) => void;
  onDeletePersonal?: (item: ChecklistItem) => void;
};

function ChecklistRow({
  item,
  disabled,
  onToggle,
  onEditPersonal,
  onDeletePersonal,
}: ChecklistRowProps) {
  const categoryLabel = checklistCategoryLabels[item.category] ?? item.category;
  const isPersonal = item.isOwnedByUser && !item.isDefault;

  return (
    <View style={[styles.itemWrap, isPersonal && styles.personalItem]}>
      <Pressable
        accessibilityLabel={item.title}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isCompleted, disabled }}
        disabled={disabled}
        onPress={() => onToggle(item.id)}
        style={[styles.item, disabled && styles.itemDisabled]}
      >
        <View style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}>
          {item.isCompleted ? (
            <MaterialCommunityIcons name="check" size={18} color={colors.white} />
          ) : null}
        </View>
        <View style={styles.copy}>
          <AppText
            variant="bodySmall"
            color={item.isCompleted ? colors.textMuted : colors.textSecondary}
            style={item.isCompleted ? styles.doneText : undefined}
            numberOfLines={3}
          >
            {item.title}
          </AppText>
          {item.description ? (
            <AppText variant="caption" color={colors.textMuted} numberOfLines={3}>
              {item.description}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.primary}>
            {categoryLabel}
            {isPersonal ? ' • мой пункт' : ''}
          </AppText>
        </View>
      </Pressable>

      {isPersonal ? (
        <View style={styles.personalActions}>
          <Pressable
            accessibilityLabel="Редактировать пункт"
            onPress={() => onEditPersonal?.(item)}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityLabel="Удалить пункт"
            onPress={() => {
              Alert.alert('Удалить пункт?', 'Это действие нельзя отменить.', [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Удалить',
                  style: 'destructive',
                  onPress: () => onDeletePersonal?.(item),
                },
              ]);
            }}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  itemWrap: {
    gap: spacing.sm,
  },
  personalItem: {
    backgroundColor: colors.surfaceRose,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  itemDisabled: {
    opacity: 0.6,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.pink,
    borderRadius: radius.xs,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
  personalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: spacing.xs,
  },
});
