import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';

type BodyMeasurementsProps = {
    weightKg: string;
    basalTemperatureC: string;
    onWeightChange: (value: string) => void;
    onBasalTemperatureChange: (value: string) => void;
    weightError?: string;
    basalTemperatureError?: string;
};

function sanitizeDecimalInput(value: string, maxIntegerDigits: number): string {
    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
    const [integerPart = '', ...fractionParts] = normalized.split('.');
    const integer = integerPart.slice(0, maxIntegerDigits);
    const fraction = fractionParts.join('').slice(0, 1);

    if (!normalized.includes('.')) return integer;
    return `${integer}.${fraction}`;
}

function sanitizeTemperatureInput(value: string): string {
    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');

    if (!normalized.includes('.')) {
        const digits = normalized.slice(0, 3);
        return digits.length > 2
            ? `${digits.slice(0, 2)}.${digits.slice(2)}`
            : digits;
    }

    return sanitizeDecimalInput(normalized, 2);
}

export function BodyMeasurements({
    weightKg,
    basalTemperatureC,
    onWeightChange,
    onBasalTemperatureChange,
    weightError,
    basalTemperatureError,
}: BodyMeasurementsProps) {
    return (
        <View style={styles.inputsRow}>
            <View style={styles.inputWrapper}>
                <AppText variant="label" color={colors.primary} uppercase>
                    Вес (кг)
                </AppText>
                <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={(value) => onWeightChange(sanitizeDecimalInput(value, 3))}
                    placeholder="60.5"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.smallInput, weightError && styles.inputError]}
                    value={weightKg}
                />
                {weightError ? (
                    <AppText variant="caption" color={colors.danger}>{weightError}</AppText>
                ) : null}
            </View>

            <View style={styles.inputWrapper}>
                <AppText variant="label" color={colors.primary} uppercase>
                    Базальная температура (°C)
                </AppText>
                <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                        onBasalTemperatureChange(sanitizeTemperatureInput(value))
                    }
                    placeholder="36.6"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.smallInput, basalTemperatureError && styles.inputError]}
                    value={basalTemperatureC}
                />
                {basalTemperatureError ? (
                    <AppText variant="caption" color={colors.danger}>
                        {basalTemperatureError}
                    </AppText>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    inputsRow: {
        gap: spacing.md,
    },
    inputWrapper: {
        flex: 1,
        gap: spacing.xs,
    },
    smallInput: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        color: colors.textPrimary,
        fontSize: 14,
        height: 44,
        paddingHorizontal: spacing.md,
    },
    inputError: {
        borderColor: colors.danger,
    },
});
