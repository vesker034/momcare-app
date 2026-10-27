import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { ReminderButton } from './ReminderButton';

type WaterTrackerCardProps = {
    waterMl: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    showReminder?: boolean;
};

export function WaterTrackerCard({
    waterMl,
    onChange,
    disabled,
    showReminder = false,
}: WaterTrackerCardProps) {
    const parsed = waterMl ? parseInt(waterMl, 10) : 0;
    const current = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;

    const update = (next: number) => {
        const safeNext = Math.max(0, next);
        onChange(safeNext === 0 ? '' : String(safeNext));
    };

    return (
        <View style={styles.formSection}>
            <AppText variant="label" color={colors.primary} uppercase>
                Вода
            </AppText>

            <View style={styles.waterCard}>
                <View style={styles.waterHeader}>
                    <MaterialCommunityIcons name="cup-water" size={22} color={colors.primary} />
                    <AppText variant="title" color={colors.primaryDark}>
                        {formatWater(current)}
                    </AppText>
                </View>

                <View style={styles.waterButtonsRow}>
                    <Pressable
                        accessibilityRole="button"
                        disabled={disabled || current <= 0}
                        onPress={() => update(current - 250)}
                        style={[
                            styles.waterButton,
                            styles.waterButtonGhost,
                            (disabled || current <= 0) && styles.waterButtonDisabled,
                        ]}
                    >
                        <MaterialCommunityIcons name="minus" size={20} color={colors.primary} />
                        <AppText variant="bodySmall" color={colors.primary} serif>
                            250
                        </AppText>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        disabled={disabled}
                        onPress={() => update(current + 250)}
                        style={[styles.waterButton, disabled && styles.waterButtonDisabled]}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                        <AppText variant="bodySmall" color={colors.white} serif>
                            250
                        </AppText>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        disabled={disabled}
                        onPress={() => update(current + 500)}
                        style={[styles.waterButton, disabled && styles.waterButtonDisabled]}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                        <AppText variant="bodySmall" color={colors.white} serif>
                            500
                        </AppText>
                    </Pressable>
                </View>

                <TextInput
                    keyboardType="numeric"
                    value={waterMl}
                    editable={!disabled}
                    onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, '');
                        onChange(digits);
                    }}
                    placeholder="Ввести вручную, мл"
                    placeholderTextColor={colors.textMuted}
                    style={styles.waterInput}
                />

                {showReminder ? <ReminderButton /> : null}
            </View>
        </View>
    );
}

function formatWater(ml: number): string {
    if (ml >= 1000) {
        const liters = ml / 1000;
        return `${liters.toFixed(liters % 1 === 0 ? 0 : 2)} л`;
    }
    return `${ml} мл`;
}

const styles = StyleSheet.create({
    formSection: {
        gap: spacing.md,
    },
    waterCard: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.xl,
        gap: spacing.md,
        padding: spacing.lg,
    },
    waterHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    waterButtonsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    waterButton: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        flex: 1,
        flexDirection: 'row',
        gap: spacing.xs,
        justifyContent: 'center',
        minHeight: 44,
    },
    waterButtonGhost: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        borderWidth: 1,
    },
    waterButtonDisabled: {
        opacity: 0.4,
    },
    waterInput: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        color: colors.textPrimary,
        fontSize: 14,
        height: 44,
        paddingHorizontal: spacing.md,
    },
});