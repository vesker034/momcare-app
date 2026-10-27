import type {
  DiaryMood,
  DiarySymptom,
  MedicationStatus,
  SleepQuality,
  SymptomSeverity,
} from '@prisma/client';

import { HttpError } from '../../../shared/errors/http-error';
import { parseDateOnly } from '../../../shared/dates/date-only';

export { parseDateOnly };

export interface DiarySymptomInput {
  type: DiarySymptom;
  severity: SymptomSeverity;
}

export interface CreateDiaryEntryDto {
  date: Date;
  wellbeingRating: number;
  moods: DiaryMood[];
  energyLevel: number;
  sleepHours: number;
  sleepQuality: SleepQuality;
  symptoms: DiarySymptomInput[];
  waterMl?: number;
  medicationStatus?: MedicationStatus;
  weightKg?: number;
  basalTemperatureC?: number;
  note?: string;
}

export interface UpdateDiaryEntryDto {
  date?: Date;
  wellbeingRating?: number;
  moods?: DiaryMood[];
  energyLevel?: number;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  symptoms?: DiarySymptomInput[] | null;
  waterMl?: number | null;
  medicationStatus?: MedicationStatus | null;
  weightKg?: number | null;
  basalTemperatureC?: number | null;
  note?: string | null;
}

interface DiaryEntryBody {
  date?: unknown;
  wellbeingRating?: unknown;
  mood?: unknown;
  moods?: unknown;
  energyLevel?: unknown;
  sleepHours?: unknown;
  sleepQuality?: unknown;
  symptoms?: unknown;
  waterMl?: unknown;
  medicationStatus?: unknown;
  weightKg?: unknown;
  basalTemperatureC?: unknown;
  note?: unknown;
  userId?: unknown;
}

const moodOptions: readonly DiaryMood[] = [
  'JOYFUL',
  'CALM',
  'NEUTRAL',
  'SAD',
  'ANXIOUS',
  'IRRITATED',
  'OVERWHELMED',
  'HOPEFUL',
  'GRATEFUL',
  'RELAXED',
  'EXCITED',
  'CONFIDENT',
  'SENSITIVE',
  'LONELY',
];

const symptomOptions: readonly DiarySymptom[] = [
  'NAUSEA',
  'VOMITING',
  'FATIGUE',
  'HEADACHE',
  'DIZZINESS',
  'HEARTBURN',
  'BACK_PAIN',
  'ABDOMINAL_DISCOMFORT',
  'SHORTNESS_OF_BREATH',
  'SWELLING',
  'FREQUENT_URINATION',
  'SLEEP_PROBLEMS',
  'CONSTIPATION',
  'LEG_CRAMPS',
  'OTHER',
];

const severityOptions: readonly SymptomSeverity[] = ['MILD', 'MODERATE', 'SEVERE'];
const sleepQualityOptions: readonly SleepQuality[] = ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'];
const medicationStatusOptions: readonly MedicationStatus[] = [
  'ON_TIME',
  'LATE',
  'MISSED',
  'NOT_APPLICABLE',
];

const moodValues = new Set<string>(moodOptions);
const symptomValues = new Set<string>(symptomOptions);
const severityValues = new Set<string>(severityOptions);
const sleepQualityValues = new Set<string>(sleepQualityOptions);
const medicationStatusValues = new Set<string>(medicationStatusOptions);

const isObject = (value: unknown): value is DiaryEntryBody => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseDateField = (value: unknown, isRequired: boolean): Date | undefined => {
  if (value === undefined) {
    if (isRequired) {
      throw new HttpError(400, 'date is required');
    }

    return undefined;
  }

  if (value === null || value === '') {
    throw new HttpError(400, 'date must be a date string in YYYY-MM-DD format');
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'date must be a date string in YYYY-MM-DD format');
  }

  return parseDateOnly(value, 'date');
};

const parseRatingField = (
  value: unknown,
  field: 'wellbeingRating' | 'energyLevel',
  isRequired: boolean,
): number | undefined => {
  if (value === undefined) {
    if (isRequired) {
      throw new HttpError(400, `${field} is required`);
    }

    return undefined;
  }

  if (value === null || value === '' || typeof value !== 'number') {
    throw new HttpError(400, `${field} must be an integer from 1 to 5`);
  }

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new HttpError(400, `${field} must be an integer from 1 to 5`);
  }

  return value;
};

const parseEnumField = <T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[],
  allowedSet: Set<string>,
  isRequired: boolean,
): T | undefined => {
  if (value === undefined) {
    if (isRequired) {
      throw new HttpError(400, `${field} is required`);
    }

    return undefined;
  }

  if (value === null || value === '') {
    throw new HttpError(400, `${field} must be one of: ${allowedValues.join(', ')}`);
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string`);
  }

  const normalizedValue = value.trim().toUpperCase();

  if (!allowedSet.has(normalizedValue)) {
    throw new HttpError(400, `${field} must be one of: ${allowedValues.join(', ')}`);
  }

  return normalizedValue as T;
};

const requireEnumField = <T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[],
  allowedSet: Set<string>,
): T => {
  const parsedValue = parseEnumField(value, field, allowedValues, allowedSet, true);

  if (parsedValue === undefined) {
    throw new HttpError(400, `${field} is required`);
  }

  return parsedValue;
};

const parseMoods = (value: unknown, isRequired: boolean): DiaryMood[] | undefined => {
  if (value === undefined) {
    if (isRequired) {
      throw new HttpError(400, 'moods is required');
    }

    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, 'moods must be an array of mood values');
  }

  if (value.length === 0) {
    throw new HttpError(400, 'moods must contain at least one value');
  }

  const seenMoods = new Set<string>();

  return value.map((item) => {
    const mood = requireEnumField(item, 'moods', moodOptions, moodValues);

    if (seenMoods.has(mood)) {
      throw new HttpError(400, `moods must not contain duplicates: ${mood}`);
    }

    seenMoods.add(mood);
    return mood;
  });
};

const parseMoodsField = (
  body: DiaryEntryBody,
  isRequired: boolean,
): DiaryMood[] | undefined => {
  if (body.moods !== undefined) {
    return parseMoods(body.moods, isRequired);
  }

  // Backward compatibility: the legacy single `mood` field becomes a one-element list.
  if (body.mood !== undefined) {
    return [requireEnumField(body.mood, 'mood', moodOptions, moodValues)];
  }

  if (isRequired) {
    throw new HttpError(400, 'moods is required');
  }

  return undefined;
};

const parseSleepQuality = (
  value: unknown,
  isRequired: boolean,
): SleepQuality | undefined => {
  return parseEnumField(
    value,
    'sleepQuality',
    sleepQualityOptions,
    sleepQualityValues,
    isRequired,
  );
};

const parseMedicationStatus = (
  value: unknown,
  isRequired: boolean,
): MedicationStatus | null | undefined => {
  if (value === undefined) {
    if (isRequired) {
      throw new HttpError(400, 'medicationStatus is required');
    }

    return undefined;
  }

  if (value === null) {
    return null;
  }

  return requireEnumField(
    value,
    'medicationStatus',
    medicationStatusOptions,
    medicationStatusValues,
  );
};

const parseSymptoms = (value: unknown): DiarySymptomInput[] | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, 'symptoms must be an array of objects');
  }

  const seenTypes = new Set<string>();

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new HttpError(400, 'each symptom must be an object with type and severity');
    }

    const type = requireEnumField(item.type, 'symptoms.type', symptomOptions, symptomValues);
    const severity = requireEnumField(
      item.severity,
      'symptoms.severity',
      severityOptions,
      severityValues,
    );

    if (seenTypes.has(type)) {
      throw new HttpError(400, `symptoms must not contain duplicate type: ${type}`);
    }

    seenTypes.add(type);

    return { type, severity };
  });
};

const parseSleepHours = (value: unknown, isRequired: boolean): number | undefined => {
  if (value === undefined) {
    if (isRequired) {
      throw new HttpError(400, 'sleepHours is required');
    }

    return undefined;
  }

  if (value === null || value === '') {
    throw new HttpError(400, 'sleepHours must be a number from 0 to 24');
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 24) {
    throw new HttpError(400, 'sleepHours must be a number from 0 to 24');
  }

  return value;
};

const parseWaterMl = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new HttpError(400, 'waterMl must be a non-negative integer');
  }

  return value;
};

const parseWeightKg = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 20 ||
    value > 300
  ) {
    throw new HttpError(400, 'weightKg must be a number from 20 to 300');
  }

  return value;
};

const parseBasalTemperatureC = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 35 ||
    value > 42
  ) {
    throw new HttpError(400, 'basalTemperatureC must be a number from 35 to 42');
  }

  return value;
};

const parseNote = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'note must be a string');
  }

  return value.trim();
};

const assertUserIdIsNotProvided = (value: unknown): void => {
  if (value !== undefined && value !== null && value !== '') {
    throw new HttpError(400, 'userId cannot be provided in request body');
  }
};

export const parseCreateDiaryEntryDto = (body: unknown): CreateDiaryEntryDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  assertUserIdIsNotProvided(body.userId);

  const symptoms = parseSymptoms(body.symptoms) ?? [];
  const waterMl = parseWaterMl(body.waterMl);
  const medicationStatus = parseMedicationStatus(body.medicationStatus, false);
  const weightKg = parseWeightKg(body.weightKg);
  const basalTemperatureC = parseBasalTemperatureC(body.basalTemperatureC);
  const note = parseNote(body.note);

  return {
    date: parseDateField(body.date, true) as Date,
    wellbeingRating: parseRatingField(body.wellbeingRating, 'wellbeingRating', true) as number,
    moods: parseMoodsField(body, true) as DiaryMood[],
    energyLevel: parseRatingField(body.energyLevel, 'energyLevel', true) as number,
    sleepHours: parseSleepHours(body.sleepHours, true) as number,
    sleepQuality: parseSleepQuality(body.sleepQuality, true) as SleepQuality,
    symptoms,
    ...(waterMl !== undefined && waterMl !== null ? { waterMl } : {}),
    ...(medicationStatus !== undefined && medicationStatus !== null
      ? { medicationStatus }
      : {}),
    ...(weightKg !== undefined && weightKg !== null ? { weightKg } : {}),
    ...(basalTemperatureC !== undefined && basalTemperatureC !== null
      ? { basalTemperatureC }
      : {}),
    ...(note !== undefined && note !== null ? { note } : {}),
  };
};

export const parseUpdateDiaryEntryDto = (body: unknown): UpdateDiaryEntryDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  assertUserIdIsNotProvided(body.userId);

  const date = parseDateField(body.date, false);
  const wellbeingRating = parseRatingField(body.wellbeingRating, 'wellbeingRating', false);
  const moods = parseMoodsField(body, false);
  const energyLevel = parseRatingField(body.energyLevel, 'energyLevel', false);
  const sleepHours = parseSleepHours(body.sleepHours, false);
  const sleepQuality = parseSleepQuality(body.sleepQuality, false);
  const symptoms = parseSymptoms(body.symptoms);
  const waterMl = parseWaterMl(body.waterMl);
  const medicationStatus = parseMedicationStatus(body.medicationStatus, false);
  const weightKg = parseWeightKg(body.weightKg);
  const basalTemperatureC = parseBasalTemperatureC(body.basalTemperatureC);
  const note = parseNote(body.note);

  const dto: UpdateDiaryEntryDto = {
    ...(date !== undefined ? { date } : {}),
    ...(wellbeingRating !== undefined ? { wellbeingRating } : {}),
    ...(moods !== undefined ? { moods } : {}),
    ...(energyLevel !== undefined ? { energyLevel } : {}),
    ...(sleepHours !== undefined ? { sleepHours } : {}),
    ...(sleepQuality !== undefined ? { sleepQuality } : {}),
    ...(symptoms !== undefined ? { symptoms } : {}),
    ...(waterMl !== undefined ? { waterMl } : {}),
    ...(medicationStatus !== undefined ? { medicationStatus } : {}),
    ...(weightKg !== undefined ? { weightKg } : {}),
    ...(basalTemperatureC !== undefined ? { basalTemperatureC } : {}),
    ...(note !== undefined ? { note } : {}),
  };

  if (Object.keys(dto).length === 0) {
    throw new HttpError(400, 'At least one diary entry field is required');
  }

  return dto;
};
