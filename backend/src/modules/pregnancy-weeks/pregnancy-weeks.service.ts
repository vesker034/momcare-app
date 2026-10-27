import type { PregnancyWeekContent } from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';
import {
  calculatePregnancyFromDueDate,
  calculatePregnancyFromLastMenstrualPeriod,
} from '../pregnancy-profile/pregnancy-calculator';
import { DailyTipResponse, resolveDailyTip } from './daily-tips';

export interface PregnancyWeekContentResponse {
  id: string;
  week: number;
  trimester: number;
  title: string;
  babySize: string | null;
  babyWeight: string | null;
  babyLength: string | null;
  fruitComparison: string | null;
  babyDevelopment: string;
  motherChanges: string;
  recommendation: string;
  symptoms: string | null;
  warnings: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyWeekSummaryResponse {
  week: number;
  trimester: number;
  title: string;
  babySize: string | null;
  babyWeight: string | null;
  fruitComparison: string | null;
}

export interface PregnancyWeekListFilters {
  trimester?: number;
}

export const parseTrimester = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'trimester must be a string query parameter');
  }

  const trimester = Number(value);

  if (!Number.isInteger(trimester) || trimester < 1 || trimester > 3) {
    throw new HttpError(400, 'trimester must be an integer from 1 to 3');
  }

  return trimester;
};

const toResponse = (content: PregnancyWeekContent): PregnancyWeekContentResponse => {
  return {
    id: content.id,
    week: content.week,
    trimester: content.trimester,
    title: content.title,
    babySize: content.babySize,
    babyWeight: content.babyWeight,
    babyLength: content.babyLength,
    fruitComparison: content.fruitComparison,
    babyDevelopment: content.babyDevelopment,
    motherChanges: content.motherChanges,
    recommendation: content.recommendation,
    symptoms: content.symptoms,
    warnings: content.warnings,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt.toISOString(),
  };
};

const toSummaryResponse = (
  content: PregnancyWeekContent,
): PregnancyWeekSummaryResponse => {
  return {
    week: content.week,
    trimester: content.trimester,
    title: content.title,
    babySize: content.babySize,
    babyWeight: content.babyWeight,
    fruitComparison: content.fruitComparison,
  };
};

export const listPregnancyWeekSummaries = async (
  filters: PregnancyWeekListFilters = {},
): Promise<PregnancyWeekSummaryResponse[]> => {
  const weeks = await prisma.pregnancyWeekContent.findMany({
    where: filters.trimester ? { trimester: filters.trimester } : undefined,
    orderBy: { week: 'asc' },
  });

  return weeks.map(toSummaryResponse);
};

export const getPregnancyWeekContent = async (
  week: number,
): Promise<PregnancyWeekContentResponse> => {
  const content = await prisma.pregnancyWeekContent.findUnique({
    where: { week },
  });

  if (!content) {
    throw new HttpError(404, 'Pregnancy week content was not found');
  }

  return toResponse(content);
};

export const getCurrentWeekContent = async (
  userId: string,
): Promise<PregnancyWeekContentResponse> => {
  const profile = await prisma.pregnancyProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new HttpError(404, 'Pregnancy profile was not found');
  }

  const currentWeek = profile.lastPeriodStartDate
    ? calculatePregnancyFromLastMenstrualPeriod(profile.lastPeriodStartDate).pregnancyWeek
    : calculatePregnancyFromDueDate(profile.dueDate).pregnancyWeek;

  return getPregnancyWeekContent(currentWeek);
};

export const getDailyTip = async (
  userId: string,
  date: Date,
): Promise<DailyTipResponse> => {
  const profile = await prisma.pregnancyProfile.findUnique({
    where: { userId },
  });

  return resolveDailyTip({
    date,
    profile: profile
      ? {
          lastPeriodStartDate: profile.lastPeriodStartDate,
          dueDate: profile.dueDate,
        }
      : null,
  });
};
