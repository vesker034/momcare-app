import type { VisitStatus } from '@prisma/client';

import { HttpError } from '../../../shared/errors/http-error';

export interface CreateVisitDto {
  title: string;
  specialist?: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  preparationNotes?: string;
  status: VisitStatus;
}

export interface UpdateVisitDto {
  title?: string;
  specialist?: string | null;
  date?: string;
  time?: string | null;
  location?: string | null;
  notes?: string | null;
  preparationNotes?: string | null;
  status?: VisitStatus;
}

interface VisitBody {
  title?: unknown;
  specialist?: unknown;
  date?: unknown;
  time?: unknown;
  location?: unknown;
  notes?: unknown;
  preparationNotes?: unknown;
  status?: unknown;
  userId?: unknown;
}

const visitStatusOptions: readonly VisitStatus[] = ['PLANNED', 'COMPLETED', 'CANCELLED'];
const visitStatusValues = new Set<string>(visitStatusOptions);

const isObject = (value: unknown): value is VisitBody => {
  return typeof value === 'object' && value !== null;
};

const assertUserIdIsNotProvided = (value: unknown): void => {
  if (value !== undefined && value !== null && value !== '') {
    throw new HttpError(400, 'userId cannot be provided in request body');
  }
};

const parseRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return value.trim();
};

const parseOptionalString = (value: unknown, fieldName: string): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `${fieldName} must be a string`);
  }

  return value.trim();
};

const parseDate = (value: unknown, isRequired: boolean): string | undefined => {
  if (value === undefined || value === null || value === '') {
    if (isRequired) {
      throw new HttpError(400, 'date is required');
    }

    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'date must be a date string in YYYY-MM-DD format');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, 'date must be in YYYY-MM-DD format');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, 'date must be a valid calendar date');
  }

  return value;
};

const parseTime = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'time must be a string in HH:mm format');
  }

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new HttpError(400, 'time must be in HH:mm format');
  }

  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    throw new HttpError(400, 'time must be a valid HH:mm value');
  }

  return value;
};

const parseStatus = (value: unknown): VisitStatus | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'status must be a string');
  }

  const normalizedStatus = value.trim().toUpperCase();

  if (!visitStatusValues.has(normalizedStatus)) {
    throw new HttpError(400, `status must be one of: ${visitStatusOptions.join(', ')}`);
  }

  return normalizedStatus as VisitStatus;
};

export const parseCreateVisitDto = (body: unknown): CreateVisitDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  assertUserIdIsNotProvided(body.userId);

  const time = parseTime(body.time);

  return {
    title: parseRequiredString(body.title, 'title'),
    date: parseDate(body.date, true) as string,
    status: parseStatus(body.status) ?? 'PLANNED',
    ...(parseOptionalString(body.specialist, 'specialist') !== undefined
      ? { specialist: parseOptionalString(body.specialist, 'specialist') ?? undefined }
      : {}),
    ...(time !== undefined ? { time: time ?? undefined } : {}),
    ...(parseOptionalString(body.location, 'location') !== undefined
      ? { location: parseOptionalString(body.location, 'location') ?? undefined }
      : {}),
    ...(parseOptionalString(body.notes, 'notes') !== undefined
      ? { notes: parseOptionalString(body.notes, 'notes') ?? undefined }
      : {}),
    ...(parseOptionalString(body.preparationNotes, 'preparationNotes') !== undefined
      ? { preparationNotes: parseOptionalString(body.preparationNotes, 'preparationNotes') ?? undefined }
      : {}),
  };
};

export const parseUpdateVisitDto = (body: unknown): UpdateVisitDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  assertUserIdIsNotProvided(body.userId);

  const dto: UpdateVisitDto = {
    title:
      body.title !== undefined ? parseRequiredString(body.title, 'title') : undefined,
    specialist: parseOptionalString(body.specialist, 'specialist'),
    date: parseDate(body.date, false),
    time: parseTime(body.time),
    location: parseOptionalString(body.location, 'location'),
    notes: parseOptionalString(body.notes, 'notes'),
    preparationNotes: parseOptionalString(body.preparationNotes, 'preparationNotes'),
    status: parseStatus(body.status),
  };

  const hasUpdate = Object.values(dto).some((value) => value !== undefined);

  if (!hasUpdate) {
    throw new HttpError(400, 'At least one visit field is required');
  }

  return dto;
};
