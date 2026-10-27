import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import {
  getSeverityLabel,
  symptoms,
  type SymptomId,
} from '../mappers/diaryMappers';

type SymptomSelectorProps = {
  selectedSymptoms: SymptomId[];
  symptomSeverities: Partial<Record<SymptomId, number>>;
  noSymptoms: boolean;
  otherSymptomText: string;
  onToggle: (symptomId: SymptomId) => void;
  onSetSeverity: (symptomId: SymptomId, severity: number) => void;
  onToggleNoSymptoms: () => void;
  onOtherTextChange: (text: string) => void;
};

export function SymptomSelector({
  selectedSymptoms,
  symptomSeverities,
  noSymptoms,
  otherSymptomText,
  onToggle,
  onSetSeverity,
  onToggleNoSymptoms,
  onOtherTextChange,
}: SymptomSelectorProps) {
  return (
    <View style={styles.formSection}>
      <AppText variant="label" color={colors.primary} uppercase>
        Симптомы
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={onToggleNoSymptoms}
        style={[
          styles.symptomChip,
          noSymptoms && styles.symptomChipSelected,
          { alignSelf: 'flex-start' },
        ]}
      >
        <AppText variant="caption">✅</AppText>
        <AppText
          variant="bodySmall"
          color={noSymptoms ? colors.primary : colors.textSecondary}
          serif
        >
          Без симптомов
        </AppText>
      </Pressable>

      <View style={styles.symptomList}>
        {symptoms
          .filter((item) => item.id !== 'OTHER')
          .map((item) => {
            const selected = selectedSymptoms.includes(item.id);
            const currentSeverity = symptomSeverities[item.id] ?? 1;

            return (
              <View key={item.id} style={styles.symptomContainer}>
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  onPress={() => onToggle(item.id)}
                  style={[
                    styles.symptomChip,
                    selected && styles.symptomChipSelected,
                  ]}
                >
                  <AppText variant="caption">{item.icon}</AppText>
                  <AppText
                    variant="bodySmall"
                    color={selected ? colors.primary : colors.textSecondary}
                    serif
                    style={styles.symptomLabel}
                  >
                    {item.label}
                  </AppText>
                </Pressable>

                {selected && (
                  <View style={styles.severityPicker}>
                    {[1, 2, 3].map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => onSetSeverity(item.id, level)}
                        style={[
                          styles.severityOption,
                          currentSeverity === level &&
                          styles.severityOptionSelected,
                        ]}
                      >
                        <AppText
                          variant="caption"
                          color={
                            currentSeverity === level
                              ? colors.white
                              : colors.textSecondary
                          }
                        >
                          {getSeverityLabel(item.id, level as 1 | 2 | 3)}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onToggle('OTHER')}
        style={[
          styles.symptomChip,
          selectedSymptoms.includes('OTHER') && styles.symptomChipSelected,
          { alignSelf: 'flex-start' },
        ]}
      >
        <AppText variant="caption">❓</AppText>
        <AppText
          variant="bodySmall"
          color={
            selectedSymptoms.includes('OTHER')
              ? colors.primary
              : colors.textSecondary
          }
          serif
        >
          Другой симптом
        </AppText>
      </Pressable>

      {selectedSymptoms.includes('OTHER') && (
        <TextInput
          multiline
          value={otherSymptomText}
          onChangeText={onOtherTextChange}
          placeholder="Опишите симптом"
          placeholderTextColor={colors.textMuted}
          style={styles.noteInput}
          textAlignVertical="top"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: spacing.md,
  },
  symptomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symptomContainer: {
    gap: spacing.xs,
  },
  symptomChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  symptomChipSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
  severityPicker: {
    flexDirection: 'row',
    gap: spacing.xxs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 2,
  },
  severityOption: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  severityOptionSelected: {
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
  symptomLabel: {
    flexShrink: 1,
  },
});