import type { DoctorQuestionStatus } from '@prisma/client';

import { HttpError } from '../../../shared/errors/http-error';

export interface CreateDoctorQuestionDto {
  question: string;
  answer?: string;
  status: DoctorQuestionStatus;
  visitId?: string;
}

export interface UpdateDoctorQuestionDto {
  question?: string;
  answer?: string | null;
  status?: DoctorQuestionStatus;
  visitId?: string | null;
}

interface DoctorQuestionBody {
  question?: unknown;
  answer?: unknown;
  status?: unknown;
  visitId?: unknown;
  userId?: unknown;
}

const doctorQuestionStatusOptions: readonly DoctorQuestionStatus[] = [
  'NEW',
  'ANSWERED',
  'ARCHIVED',
];
const doctorQuestionStatusValues = new Set<string>(doctorQuestionStatusOptions);

const isObject = (value: unknown): value is DoctorQuestionBody => {
  return typeof value === 'object' && value !== null;
};

const assertUserIdIsNotProvided = (value: unknown): void => {
  if (value !== undefined && value !== null && value !== '') {
    throw new HttpError(400, 'userId cannot be provided in request body');
  }
};

const parseRequiredText = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return value.trim();
};

const parseOptionalText = (value: unknown, fieldName: string): string | null | undefined => {
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

const parseStatus = (value: unknown): DoctorQuestionStatus | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'status must be a string');
  }

  const normalizedStatus = value.trim().toUpperCase();

  if (!doctorQuestionStatusValues.has(normalizedStatus)) {
    throw new HttpError(
      400,
      `status must be one of: ${doctorQuestionStatusOptions.join(', ')}`,
    );
  }

  return normalizedStatus as DoctorQuestionStatus;
};

export const parseCreateDoctorQuestionDto = (body: unknown): CreateDoctorQuestionDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  assertUserIdIsNotProvided(body.userId);

  const answer = parseOptionalText(body.answer, 'answer');
  const visitId = parseOptionalText(body.visitId, 'visitId');

  return {
    question: parseRequiredText(body.question, 'question'),
    status: parseStatus(body.status) ?? 'NEW',
    ...(answer !== undefined ? { answer: answer ?? undefined } : {}),
    ...(visitId !== undefined ? { visitId: visitId ?? undefined } : {}),
  };
};

export const parseUpdateDoctorQuestionDto = (body: unknown): UpdateDoctorQuestionDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  assertUserIdIsNotProvided(body.userId);

  const dto: UpdateDoctorQuestionDto = {
    question:
      body.question !== undefined ? parseRequiredText(body.question, 'question') : undefined,
    answer: parseOptionalText(body.answer, 'answer'),
    status: parseStatus(body.status),
    visitId: parseOptionalText(body.visitId, 'visitId'),
  };

  const hasUpdate = Object.values(dto).some((value) => value !== undefined);

  if (!hasUpdate) {
    throw new HttpError(400, 'At least one doctor question field is required');
  }

  return dto;
};
