import { useCallback, useEffect, useState } from 'react';

import {
    buildDiaryRequestPayload,
    defaultDiaryFormValues,
    toDiaryFormValues,
    type MoodId,
    type SymptomId,
} from '../mappers/diaryMappers';
import type { DiaryEntry, MedicationStatus, SleepQuality } from '../../../types/api';

export type DiaryFormState = {
    wellbeingRating: number;
    selectedMoods: MoodId[];
    selectedSymptoms: SymptomId[];
    symptomSeverities: Partial<Record<SymptomId, number>>;
    otherSymptomText: string;
    noSymptoms: boolean;
    sleepHours: number;
    sleepQuality: SleepQuality;
    energyLevel: number;
    waterMl: string;
    medicationStatus: MedicationStatus;
    weightKg: string;
    basalTemperatureC: string;
    note: string;
};

function makeInitialState(): DiaryFormState {
    return {
        wellbeingRating: defaultDiaryFormValues.wellbeingRating ?? 3,
        selectedMoods: defaultDiaryFormValues.moods,
        selectedSymptoms: defaultDiaryFormValues.symptoms,
        symptomSeverities: {},
        otherSymptomText: '',
        noSymptoms: false,
        sleepHours: defaultDiaryFormValues.sleepHours,
        sleepQuality: defaultDiaryFormValues.sleepQuality ?? 'GOOD',
        energyLevel: defaultDiaryFormValues.energyLevel ?? 3,
        waterMl: defaultDiaryFormValues.waterMl ? String(defaultDiaryFormValues.waterMl) : '',
        medicationStatus: defaultDiaryFormValues.medicationStatus ?? 'NOT_APPLICABLE',
        weightKg: defaultDiaryFormValues.weightKg ? String(defaultDiaryFormValues.weightKg) : '',
        basalTemperatureC: defaultDiaryFormValues.basalTemperatureC
            ? String(defaultDiaryFormValues.basalTemperatureC)
            : '',
        note: defaultDiaryFormValues.note,
    };
}

export function useDiaryForm() {
    const [state, setState] = useState<DiaryFormState>(makeInitialState);
    const [isDirty, setIsDirty] = useState(false);
    const [initialSnapshot, setInitialSnapshot] = useState<string>('');

    const setWellbeingRating = (value: number) =>
        setState((prev) => ({ ...prev, wellbeingRating: value }));
    const setSleepHours = (value: number) =>
        setState((prev) => ({ ...prev, sleepHours: value }));
    const setSleepQuality = (value: SleepQuality) =>
        setState((prev) => ({ ...prev, sleepQuality: value }));
    const setEnergyLevel = (value: number) =>
        setState((prev) => ({ ...prev, energyLevel: value }));
    const setWaterMl = (value: string) =>
        setState((prev) => ({ ...prev, waterMl: value }));
    const setMedicationStatus = (value: MedicationStatus) =>
        setState((prev) => ({ ...prev, medicationStatus: value }));
    const setWeightKg = (value: string) =>
        setState((prev) => ({ ...prev, weightKg: value }));
    const setBasalTemperatureC = (value: string) =>
        setState((prev) => ({ ...prev, basalTemperatureC: value }));
    const setNote = (value: string) =>
        setState((prev) => ({ ...prev, note: value }));
    const setOtherSymptomText = (value: string) =>
        setState((prev) => ({ ...prev, otherSymptomText: value }));

    const toggleMood = useCallback((moodId: MoodId) => {
        setState((prev) => ({
            ...prev,
            selectedMoods: prev.selectedMoods.includes(moodId)
                ? prev.selectedMoods.filter((m) => m !== moodId)
                : [...prev.selectedMoods, moodId],
        }));
    }, []);

    const toggleSymptom = useCallback((symptomId: SymptomId) => {
        setState((prev) => {
            const isSelected = prev.selectedSymptoms.includes(symptomId);
            if (isSelected) {
                const nextSeverities = { ...prev.symptomSeverities };
                delete nextSeverities[symptomId];
                return {
                    ...prev,
                    noSymptoms: false,
                    selectedSymptoms: prev.selectedSymptoms.filter((item) => item !== symptomId),
                    symptomSeverities: nextSeverities,
                    otherSymptomText: symptomId === 'OTHER' ? '' : prev.otherSymptomText,
                };
            }
            return {
                ...prev,
                noSymptoms: false,
                selectedSymptoms: [...prev.selectedSymptoms, symptomId],
                symptomSeverities: { ...prev.symptomSeverities, [symptomId]: 1 },
            };
        });
    }, []);

    const toggleNoSymptoms = useCallback(() => {
        setState((prev) => {
            const next = !prev.noSymptoms;
            if (next) {
                return {
                    ...prev,
                    noSymptoms: true,
                    selectedSymptoms: [],
                    symptomSeverities: {},
                    otherSymptomText: '',
                };
            }
            return { ...prev, noSymptoms: false };
        });
    }, []);

    const setSeverity = useCallback((symptomId: SymptomId, severity: number) => {
        setState((prev) => ({
            ...prev,
            symptomSeverities: { ...prev.symptomSeverities, [symptomId]: severity },
        }));
    }, []);

    const buildSnapshot = useCallback((): string => {
        return JSON.stringify({
            wellbeingRating: state.wellbeingRating,
            moods: state.selectedMoods,
            selectedSymptoms: state.selectedSymptoms,
            symptomSeverities: state.symptomSeverities,
            sleepHours: state.sleepHours,
            sleepQuality: state.sleepQuality,
            energyLevel: state.energyLevel,
            waterMl: state.waterMl,
            medicationStatus: state.medicationStatus,
            weightKg: state.weightKg,
            basalTemperatureC: state.basalTemperatureC,
            note: state.note,
            otherSymptomText: state.otherSymptomText,
            noSymptoms: state.noSymptoms,
        });
    }, [state]);

    useEffect(() => {
        if (!initialSnapshot) return;
        setIsDirty(buildSnapshot() !== initialSnapshot);
    }, [buildSnapshot, initialSnapshot]);

    const applyEntryToForm = useCallback((entry: DiaryEntry) => {
        const values = toDiaryFormValues(entry);
        const severityMap: Partial<Record<SymptomId, number>> = {};
        (entry.symptoms || []).forEach((item) => {
            const value =
                item.severity === 'MILD' ? 1 : item.severity === 'MODERATE' ? 2 : 3;
            severityMap[item.type as SymptomId] = value;
        });

        const noteText = values.note ?? '';
        const otherMatch = noteText.match(/Другой симптом:\s*(.+)/i);
        const cleanNote = otherMatch
            ? noteText.replace(/\n?Другой симптом:\s*.+/i, '').trim()
            : noteText;

        const nextState: DiaryFormState = {
            wellbeingRating: values.wellbeingRating,
            selectedMoods: values.moods,
            selectedSymptoms: values.symptoms,
            symptomSeverities: severityMap,
            otherSymptomText: otherMatch ? otherMatch[1].trim() : '',
            noSymptoms: values.symptoms.length === 0,
            sleepHours: values.sleepHours,
            sleepQuality: values.sleepQuality,
            energyLevel: values.energyLevel,
            waterMl: values.waterMl !== null ? String(values.waterMl) : '',
            medicationStatus: values.medicationStatus ?? 'NOT_APPLICABLE',
            weightKg: values.weightKg !== null ? String(values.weightKg) : '',
            basalTemperatureC:
                values.basalTemperatureC !== null ? String(values.basalTemperatureC) : '',
            note: cleanNote,
        };

        setState(nextState);
        setInitialSnapshot(JSON.stringify({
            wellbeingRating: nextState.wellbeingRating,
            moods: nextState.selectedMoods,
            selectedSymptoms: nextState.selectedSymptoms,
            symptomSeverities: nextState.symptomSeverities,
            sleepHours: nextState.sleepHours,
            sleepQuality: nextState.sleepQuality,
            energyLevel: nextState.energyLevel,
            waterMl: nextState.waterMl,
            medicationStatus: nextState.medicationStatus,
            weightKg: nextState.weightKg,
            basalTemperatureC: nextState.basalTemperatureC,
            note: nextState.note,
            otherSymptomText: nextState.otherSymptomText,
            noSymptoms: nextState.noSymptoms,
        }));
        setIsDirty(false);
    }, []);

    const resetForm = useCallback(() => {
        const next = makeInitialState();
        setState(next);
        setInitialSnapshot(JSON.stringify({
            wellbeingRating: next.wellbeingRating,
            moods: next.selectedMoods,
            selectedSymptoms: next.selectedSymptoms,
            symptomSeverities: next.symptomSeverities,
            sleepHours: next.sleepHours,
            sleepQuality: next.sleepQuality,
            energyLevel: next.energyLevel,
            waterMl: next.waterMl,
            medicationStatus: next.medicationStatus,
            weightKg: next.weightKg,
            basalTemperatureC: next.basalTemperatureC,
            note: next.note,
            otherSymptomText: next.otherSymptomText,
            noSymptoms: next.noSymptoms,
        }));
        setIsDirty(false);
    }, []);

    const buildPayload = useCallback(() => {
        return buildDiaryRequestPayload({
            wellbeingRating: state.wellbeingRating,
            selectedMoods: state.selectedMoods,
            selectedSymptoms: state.selectedSymptoms,
            symptomSeverities: state.symptomSeverities,
            sleepHours: state.sleepHours,
            sleepQuality: state.sleepQuality,
            energyLevel: state.energyLevel,
            waterMl: state.waterMl,
            medicationStatus: state.medicationStatus,
            weightKg: state.weightKg,
            basalTemperatureC: state.basalTemperatureC,
            note: state.note,
            otherSymptomText: state.otherSymptomText,
        });
    }, [state]);

    return {
        state,
        isDirty,
        setIsDirty,
        setWellbeingRating,
        setSleepHours,
        setSleepQuality,
        setEnergyLevel,
        setWaterMl,
        setMedicationStatus,
        setWeightKg,
        setBasalTemperatureC,
        setNote,
        setOtherSymptomText,
        toggleMood,
        toggleSymptom,
        toggleNoSymptoms,
        setSeverity,
        applyEntryToForm,
        resetForm,
        buildPayload,
    };
}