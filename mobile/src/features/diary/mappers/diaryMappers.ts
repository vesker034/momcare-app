import type {
  CreateDiaryEntryRequest,
  DiaryEntry,
  DiaryMood,
  DiarySymptomItem,
  DiarySymptomType,
  SleepQuality,
  UpdateDiaryEntryRequest,
} from '../../../types/api';

export type MoodId =
  | 'joyful'
  | 'calm'
  | 'neutral'
  | 'sad'
  | 'anxious'
  | 'irritated'
  | 'overwhelmed'
  | 'hopeful'
  | 'grateful'
  | 'relaxed'
  | 'excited'
  | 'confident'
  | 'sensitive'
  | 'lonely';
export type SymptomId = DiarySymptomType;

import type { MedicationStatus } from '../../../types/api';

export type DiaryFormValues = {
  wellbeingRating: number;
  moods: MoodId[];
  symptoms: SymptomId[];
  sleepHours: number;
  sleepQuality: SleepQuality;
  energyLevel: number;
  waterMl: number | null;
  medicationStatus: MedicationStatus | null;
  weightKg: number | null;
  basalTemperatureC: number | null;
  note: string;
};

export const moods: Array<{ id: MoodId; emoji: string; label: string }> = [
  { id: 'calm', emoji: '😌', label: 'Спокойствие' },
  { id: 'joyful', emoji: '✨', label: 'Радость' },
  { id: 'anxious', emoji: '😟', label: 'Тревожность' },
  { id: 'sad', emoji: '😢', label: 'Грусть' },
  { id: 'neutral', emoji: '😐', label: 'Нейтральность' },
  { id: 'irritated', emoji: '😤', label: 'Раздражённость' },
  { id: 'overwhelmed', emoji: '🥵', label: 'Перегруженность' },
  { id: 'hopeful', emoji: '🌟', label: 'Оптимистичность' },
  { id: 'grateful', emoji: '🙏', label: 'Благодарность' },
  { id: 'relaxed', emoji: '🛋️', label: 'Расслабленность' },
  { id: 'excited', emoji: '🤩', label: 'Взволнованность' },
  { id: 'confident', emoji: '💪', label: 'Уверенность' },
  { id: 'sensitive', emoji: '🥺', label: 'Чувствительность' },
  { id: 'lonely', emoji: '🫂', label: 'Одиночество' },
];

export type SeverityForms = {
  mild: string;
  moderate: string;
  severe: string;
};

export type SymptomMeta = {
  id: DiarySymptomType;
  label: string;
  icon: string;
  severityForms: SeverityForms;
};

export const SYMPTOMS_LIST: SymptomMeta[] = [
  {
    id: 'NAUSEA',
    label: 'Тошнота',
    icon: '🤢',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'FATIGUE',
    label: 'Усталость',
    icon: '💤',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'HEADACHE',
    label: 'Головная боль',
    icon: '🤕',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'BACK_PAIN',
    label: 'Боль в спине',
    icon: '🦴',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'SLEEP_PROBLEMS',
    label: 'Проблемы со сном',
    icon: '🌙',
    severityForms: { mild: 'слабые', moderate: 'умеренные', severe: 'сильные' },
  },
  {
    id: 'HEARTBURN',
    label: 'Изжога',
    icon: '🔥',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'SWELLING',
    label: 'Отёки',
    icon: '💧',
    severityForms: { mild: 'слабые', moderate: 'умеренные', severe: 'сильные' },
  },
  {
    id: 'DIZZINESS',
    label: 'Головокружение',
    icon: '💫',
    severityForms: { mild: 'слабое', moderate: 'умеренное', severe: 'сильное' },
  },
  {
    id: 'SHORTNESS_OF_BREATH',
    label: 'Одышка',
    icon: '😮‍💨',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'ABDOMINAL_DISCOMFORT',
    label: 'Вздутие',
    icon: '🎈',
    severityForms: { mild: 'слабое', moderate: 'умеренное', severe: 'сильное' },
  },
  {
    id: 'FREQUENT_URINATION',
    label: 'Частое мочеиспускание',
    icon: '🚽',
    severityForms: { mild: 'слабое', moderate: 'умеренное', severe: 'сильное' },
  },
  {
    id: 'CONSTIPATION',
    label: 'Запор',
    icon: '😣',
    severityForms: { mild: 'слабый', moderate: 'умеренный', severe: 'сильный' },
  },
  {
    id: 'LEG_CRAMPS',
    label: 'Судороги в ногах',
    icon: '🦶',
    severityForms: { mild: 'слабые', moderate: 'умеренные', severe: 'сильные' },
  },
  {
    id: 'VOMITING',
    label: 'Рвота',
    icon: '🤮',
    severityForms: { mild: 'слабая', moderate: 'умеренная', severe: 'сильная' },
  },
  {
    id: 'OTHER',
    label: 'Другое',
    icon: '❓',
    severityForms: { mild: 'слабое', moderate: 'умеренное', severe: 'сильное' },
  },
];

export const symptoms = SYMPTOMS_LIST;
export function getSymptomMeta(id: DiarySymptomType): SymptomMeta | undefined {
  return SYMPTOMS_LIST.find((s) => s.id === id);
}

export function getSeverityLabel(
  id: DiarySymptomType,
  severity: 1 | 2 | 3,
): string {
  const meta = getSymptomMeta(id);
  if (!meta) {
    return severity === 1 ? 'слабая' : severity === 2 ? 'умеренная' : 'сильная';
  }
  if (severity === 1) return meta.severityForms.mild;
  if (severity === 2) return meta.severityForms.moderate;
  return meta.severityForms.severe;
}

const moodToApi: Record<MoodId, DiaryMood> = {
  joyful: 'JOYFUL',
  calm: 'CALM',
  neutral: 'NEUTRAL',
  sad: 'SAD',
  anxious: 'ANXIOUS',
  irritated: 'IRRITATED',
  overwhelmed: 'OVERWHELMED',
  hopeful: 'HOPEFUL',
  grateful: 'GRATEFUL',
  relaxed: 'RELAXED',
  excited: 'EXCITED',
  confident: 'CONFIDENT',
  sensitive: 'SENSITIVE',
  lonely: 'LONELY',
};

const apiToMood: Record<DiaryMood, MoodId> = {
  JOYFUL: 'joyful',
  CALM: 'calm',
  NEUTRAL: 'neutral',
  SAD: 'sad',
  ANXIOUS: 'anxious',
  IRRITATED: 'irritated',
  OVERWHELMED: 'overwhelmed',
  HOPEFUL: 'hopeful',
  GRATEFUL: 'grateful',
  RELAXED: 'relaxed',
  EXCITED: 'excited',
  CONFIDENT: 'confident',
  SENSITIVE: 'sensitive',
  LONELY: 'lonely',
};

export const defaultDiaryFormValues: DiaryFormValues = {
  wellbeingRating: 3,
  moods: [],
  symptoms: [],
  sleepHours: 8.0,
  sleepQuality: 'GOOD',
  energyLevel: 3,
  waterMl: null,
  medicationStatus: null,
  weightKg: null,
  basalTemperatureC: null,
  note: '',
};

export function toCreateDiaryEntryRequest(
  values: DiaryFormValues,
): CreateDiaryEntryRequest {
  const note = values.note.trim();

  return {
    date: toApiDateString(new Date()),
    wellbeingRating: values.wellbeingRating,
    moods: values.moods.map((m) => moodToApi[m]),
    energyLevel: values.energyLevel,
    sleepHours: values.sleepHours,
    sleepQuality: values.sleepQuality,
    symptoms: values.symptoms.map((symptomType) => ({
      type: symptomType,
      severity: 'MILD',
    })),
    ...(values.waterMl !== null ? { waterMl: values.waterMl } : {}),
    ...(values.medicationStatus !== null
      ? { medicationStatus: values.medicationStatus }
      : {}),
    ...(values.weightKg !== null ? { weightKg: values.weightKg } : {}),
    ...(values.basalTemperatureC !== null
      ? { basalTemperatureC: values.basalTemperatureC }
      : {}),
    ...(note ? { note } : {}),
  };
}

export function toUpdateDiaryEntryRequest(
  values: DiaryFormValues,
): UpdateDiaryEntryRequest {
  const note = values.note.trim();

  return {
    wellbeingRating: values.wellbeingRating,
    moods: values.moods.map((m) => moodToApi[m]),
    energyLevel: values.energyLevel,
    sleepHours: values.sleepHours,
    sleepQuality: values.sleepQuality,
    symptoms: values.symptoms.map((symptomType) => ({
      type: symptomType,
      severity: 'MILD',
    })),
    waterMl: values.waterMl,
    medicationStatus: values.medicationStatus,
    weightKg: values.weightKg,
    basalTemperatureC: values.basalTemperatureC,
    note: values.note,
  };
}

export function toDiaryFormValues(entry: DiaryEntry): DiaryFormValues {
  const apiMoods = entry.moods ?? (entry.mood ? [entry.mood] : []);
  return {
    wellbeingRating: entry.wellbeingRating,
    moods: apiMoods.map((m) => apiToMood[m] ?? 'neutral'),
    symptoms: (entry.symptoms || []).map((item) => item.type),
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    energyLevel: entry.energyLevel,
    waterMl: entry.waterMl,
    medicationStatus: entry.medicationStatus,
    weightKg: entry.weightKg,
    basalTemperatureC: entry.basalTemperatureC,
    note: entry.note ?? '',
  };
}

export function getMoodEmojis(apiMoods: DiaryMood[] = []): string[] {
  return apiMoods
    .map((m) => {
      const id = apiToMood[m];
      const found = moods.find((item) => item.id === id);
      return found?.emoji ?? null;
    })
    .filter((e): e is string => Boolean(e));
}

export function getSymptomLabels(apiSymptoms: DiarySymptomItem[] = []) {
  return apiSymptoms
    .map((item) => {
      const found = SYMPTOMS_LIST.find((s) => s.id === item.type);
      return found ? found.label : null;
    })
    .filter((label): label is string => Boolean(label));
}

export function formatDiaryDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export type DiaryFormInput = {
  wellbeingRating: number;
  selectedMoods: MoodId[];
  selectedSymptoms: SymptomId[];
  symptomSeverities: Partial<Record<SymptomId, number>>;
  sleepHours: number;
  sleepQuality: SleepQuality;
  energyLevel: number;
  waterMl: string;
  medicationStatus: MedicationStatus;
  weightKg: string;
  basalTemperatureC: string;
  note: string;
  otherSymptomText: string;
};

export type DiaryRequestPayload = {
  formValues: DiaryFormValues;
  symptomsWithSeverity: Array<{
    type: SymptomId;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
  }>;
};

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 300;
export const MIN_BASAL_TEMPERATURE_C = 35;
export const MAX_BASAL_TEMPERATURE_C = 42;

export type DiaryMeasurementErrors = {
  weightKg?: string;
  basalTemperatureC?: string;
};

function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

export function getDiaryMeasurementErrors(
  weightKg: string,
  basalTemperatureC: string,
): DiaryMeasurementErrors {
  const errors: DiaryMeasurementErrors = {};
  const weight = parseDecimalInput(weightKg);
  const temperature = parseDecimalInput(basalTemperatureC);

  if (
    weight !== null &&
    (!Number.isFinite(weight) || weight < MIN_WEIGHT_KG || weight > MAX_WEIGHT_KG)
  ) {
    errors.weightKg = `Укажите вес от ${MIN_WEIGHT_KG} до ${MAX_WEIGHT_KG} кг`;
  }

  if (
    temperature !== null &&
    (!Number.isFinite(temperature) ||
      temperature < MIN_BASAL_TEMPERATURE_C ||
      temperature > MAX_BASAL_TEMPERATURE_C)
  ) {
    errors.basalTemperatureC =
      `Укажите температуру от ${MIN_BASAL_TEMPERATURE_C} до ${MAX_BASAL_TEMPERATURE_C} °C`;
  }

  return errors;
}

const severityMapToApi: Record<number, 'MILD' | 'MODERATE' | 'SEVERE'> = {
  1: 'MILD',
  2: 'MODERATE',
  3: 'SEVERE',
};

export function buildDiaryRequestPayload(
  input: DiaryFormInput,
): DiaryRequestPayload {
  const parsedWater = input.waterMl ? parseInt(input.waterMl, 10) : null;
  const safeWater =
    parsedWater !== null && !Number.isNaN(parsedWater) && parsedWater >= 0
      ? parsedWater
      : null;

  const parsedWeight = parseDecimalInput(input.weightKg);
  const parsedTemp = parseDecimalInput(input.basalTemperatureC);

  const otherText = input.otherSymptomText.trim();
  const noteWithOther =
    input.selectedSymptoms.includes('OTHER') && otherText
      ? `${input.note ? `${input.note}\n` : ''}Другой симптом: ${otherText}`
      : input.note;

  const formValues: DiaryFormValues = {
    wellbeingRating: input.wellbeingRating,
    moods: input.selectedMoods,
    symptoms: input.selectedSymptoms,
    sleepHours: input.sleepHours,
    sleepQuality: input.sleepQuality,
    energyLevel: input.energyLevel,
    waterMl: safeWater,
    medicationStatus: input.medicationStatus,
    weightKg: parsedWeight !== null && Number.isFinite(parsedWeight) ? parsedWeight : null,
    basalTemperatureC:
      parsedTemp !== null && Number.isFinite(parsedTemp) ? parsedTemp : null,
    note: noteWithOther,
  };

  const symptomsWithSeverity = input.selectedSymptoms.map((type) => ({
    type,
    severity: severityMapToApi[input.symptomSeverities[type] ?? 1] ?? 'MILD',
  }));

  return { formValues, symptomsWithSeverity };
}

function toApiDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
