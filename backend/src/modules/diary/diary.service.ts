import { Prisma } from '@prisma/client';
import type {
  DiaryEntry,
  DiaryMood,
  DiarySymptom,
  DiarySymptomEntry,
  MedicationStatus,
  SleepQuality,
  SymptomSeverity,
} from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';
import { CreateDiaryEntryDto, UpdateDiaryEntryDto } from './dto/diary-entry.dto';

type DiaryEntryWithSymptoms = DiaryEntry & {
  symptoms: DiarySymptomEntry[];
};

export interface DiarySymptomResponse {
  type: DiarySymptom;
  severity: SymptomSeverity;
}

export interface DiaryEntryResponse {
  id: string;
  date: string;
  wellbeingRating: number;
  moods: DiaryMood[];
  mood: DiaryMood | null;
  energyLevel: number;
  sleepHours: number;
  sleepQuality: SleepQuality;
  symptoms: DiarySymptomResponse[];
  waterMl: number | null;
  medicationStatus: MedicationStatus | null;
  weightKg: number | null;
  basalTemperatureC: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryDateFilter {
  dateFrom?: Date;
  dateTo?: Date;
}

interface DiaryEntryCreateData {
  entryDate: Date;
  wellbeingRating: number;
  moods: DiaryMood[];
  energyLevel: number;
  sleepHours: number;
  sleepQuality: SleepQuality;
  waterMl?: number | null;
  medicationStatus?: MedicationStatus | null;
  weightKg?: number | null;
  basalTemperatureC?: number | null;
  notes?: string | null;
}

const toDateString = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const toWeight = (weightKg: DiaryEntry['weightKg']): number | null => {
  return weightKg === null ? null : Number(weightKg.toString());
};

const toResponse = (entry: DiaryEntryWithSymptoms): DiaryEntryResponse => {
  return {
    id: entry.id,
    date: toDateString(entry.entryDate),
    wellbeingRating: entry.wellbeingRating,
    moods: entry.moods,
    mood: entry.moods.length > 0 ? entry.moods[0] : null,
    energyLevel: entry.energyLevel,
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    symptoms: entry.symptoms
      .map((symptom) => ({
        type: symptom.type,
        severity: symptom.severity,
      }))
      .sort((left, right) => {
        if (left.type === right.type) {
          return 0;
        }

        return left.type < right.type ? -1 : 1;
      }),
    waterMl: entry.waterMl,
    medicationStatus: entry.medicationStatus,
    weightKg: toWeight(entry.weightKg),
    basalTemperatureC: entry.basalTemperatureC,
    note: entry.notes,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
};

const buildOptionalScalarData = (
  dto: CreateDiaryEntryDto | UpdateDiaryEntryDto,
): {
  waterMl?: number | null;
  medicationStatus?: MedicationStatus | null;
  weightKg?: number | null;
  basalTemperatureC?: number | null;
  notes?: string | null;
} => {
  return {
    ...('waterMl' in dto && dto.waterMl !== undefined ? { waterMl: dto.waterMl } : {}),
    ...('medicationStatus' in dto && dto.medicationStatus !== undefined
      ? { medicationStatus: dto.medicationStatus }
      : {}),
    ...('weightKg' in dto && dto.weightKg !== undefined ? { weightKg: dto.weightKg } : {}),
    ...('basalTemperatureC' in dto && dto.basalTemperatureC !== undefined
      ? { basalTemperatureC: dto.basalTemperatureC }
      : {}),
    ...('note' in dto && dto.note !== undefined ? { notes: dto.note } : {}),
  };
};

const buildCreateData = (dto: CreateDiaryEntryDto): DiaryEntryCreateData => {
  return {
    entryDate: dto.date,
    wellbeingRating: dto.wellbeingRating,
    moods: dto.moods,
    energyLevel: dto.energyLevel,
    sleepHours: dto.sleepHours,
    sleepQuality: dto.sleepQuality,
    ...buildOptionalScalarData(dto),
  };
};

const buildUpdateData = (
  dto: UpdateDiaryEntryDto,
): {
  entryDate?: Date;
  wellbeingRating?: number;
  moods?: DiaryMood[];
  energyLevel?: number;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  waterMl?: number | null;
  medicationStatus?: MedicationStatus | null;
  weightKg?: number | null;
  basalTemperatureC?: number | null;
  notes?: string | null;
} => {
  return {
    ...(dto.date !== undefined ? { entryDate: dto.date } : {}),
    ...(dto.wellbeingRating !== undefined ? { wellbeingRating: dto.wellbeingRating } : {}),
    ...(dto.moods !== undefined ? { moods: dto.moods } : {}),
    ...(dto.energyLevel !== undefined ? { energyLevel: dto.energyLevel } : {}),
    ...(dto.sleepHours !== undefined ? { sleepHours: dto.sleepHours } : {}),
    ...(dto.sleepQuality !== undefined ? { sleepQuality: dto.sleepQuality } : {}),
    ...buildOptionalScalarData(dto),
  };
};

const findEntryByDate = async (userId: string, entryDate: Date): Promise<DiaryEntry | null> => {
  return prisma.diaryEntry.findUnique({
    where: {
      userId_entryDate: {
        userId,
        entryDate,
      },
    },
  });
};

const duplicateDateError = (entryId: string): HttpError => {
  return new HttpError(409, 'Diary entry for this date already exists', { entryId });
};

const isUniqueConstraintViolation = (error: unknown): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
};

const rethrowAsDateConflict = async (
  error: unknown,
  userId: string,
  entryDate: Date,
): Promise<never> => {
  if (isUniqueConstraintViolation(error)) {
    const existingEntry = await findEntryByDate(userId, entryDate);

    if (existingEntry) {
      throw duplicateDateError(existingEntry.id);
    }
  }

  throw error;
};

const findOwnedEntry = async (userId: string, entryId: string): Promise<DiaryEntry> => {
  const entry = await prisma.diaryEntry.findFirst({
    where: {
      id: entryId,
      userId,
    },
  });

  if (!entry) {
    throw new HttpError(404, 'Diary entry was not found');
  }

  return entry;
};

export const getDiaryEntries = async (
  userId: string,
  filter: DiaryDateFilter = {},
): Promise<DiaryEntryResponse[]> => {
  const hasDateFilter = filter.dateFrom !== undefined || filter.dateTo !== undefined;

  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId,
      ...(hasDateFilter
        ? {
            entryDate: {
              ...(filter.dateFrom !== undefined ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo !== undefined ? { lte: filter.dateTo } : {}),
            },
          }
        : {}),
    },
    include: {
      symptoms: true,
    },
    orderBy: {
      entryDate: 'desc',
    },
  });

  return entries.map(toResponse);
};

export const getDiaryEntry = async (
  userId: string,
  entryId: string,
): Promise<DiaryEntryResponse> => {
  const entry = await prisma.diaryEntry.findFirst({
    where: {
      id: entryId,
      userId,
    },
    include: {
      symptoms: true,
    },
  });

  if (!entry) {
    throw new HttpError(404, 'Diary entry was not found');
  }

  return toResponse(entry);
};

export const createDiaryEntry = async (
  userId: string,
  dto: CreateDiaryEntryDto,
): Promise<DiaryEntryResponse> => {
  const existingEntry = await findEntryByDate(userId, dto.date);

  if (existingEntry) {
    throw duplicateDateError(existingEntry.id);
  }

  try {
    const entry = await prisma.diaryEntry.create({
      data: {
        userId,
        ...buildCreateData(dto),
        symptoms: {
          create: dto.symptoms,
        },
      },
      include: {
        symptoms: true,
      },
    });

    return toResponse(entry);
  } catch (error) {
    return rethrowAsDateConflict(error, userId, dto.date);
  }
};

export const updateDiaryEntry = async (
  userId: string,
  entryId: string,
  dto: UpdateDiaryEntryDto,
): Promise<DiaryEntryResponse> => {
  const existingEntry = await findOwnedEntry(userId, entryId);
  const entryDate = dto.date ?? existingEntry.entryDate;

  if (dto.date !== undefined && toDateString(entryDate) !== toDateString(existingEntry.entryDate)) {
    const conflictingEntry = await findEntryByDate(userId, entryDate);

    if (conflictingEntry && conflictingEntry.id !== entryId) {
      throw duplicateDateError(conflictingEntry.id);
    }
  }

  try {
    const entry = await prisma.diaryEntry.update({
      where: { id: entryId },
      data: {
        ...buildUpdateData(dto),
        ...(dto.symptoms !== undefined
          ? {
              symptoms: {
                deleteMany: {},
                create: dto.symptoms ?? [],
              },
            }
          : {}),
      },
      include: {
        symptoms: true,
      },
    });

    return toResponse(entry);
  } catch (error) {
    return rethrowAsDateConflict(error, userId, entryDate);
  }
};

export const deleteDiaryEntry = async (userId: string, entryId: string): Promise<void> => {
  const entry = await findOwnedEntry(userId, entryId);

  await prisma.diaryEntry.delete({
    where: { id: entry.id },
  });
};
