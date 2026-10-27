import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { moods, type MoodId } from '../mappers/diaryMappers';

type MoodSelectorProps = {
  selectedMoods: MoodId[];
  onToggle: (moodId: MoodId) => void;
};

export function MoodSelector({ selectedMoods, onToggle }: MoodSelectorProps) {
  return (
    <View style={styles.formSection}>
      <AppText variant="label" color={colors.primary} uppercase>
        Настроение
      </AppText>
      <View style={styles.moodRow}>
        {moods.map((item) => {
          const isSelected = selectedMoods.includes(item.id);
          return (
            <Pressable
              accessibilityLabel={`Настроение ${item.label}`}
              accessibilityRole="button"
              key={item.id}
              onPress={() => onToggle(item.id)}
              style={styles.moodItem}
            >
              <View
                style={[styles.moodIcon, isSelected && styles.moodIconSelected]}
              >
                <AppText align="center" style={styles.moodEmoji}>
                  {item.emoji}
                </AppText>
              </View>
              <AppText
                variant="caption"
                color={isSelected ? colors.primary : colors.textSecondary}
                align="center"
                serif
              >
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  moodIconSelected: {
    backgroundColor: colors.pink,
  },
  moodEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
});