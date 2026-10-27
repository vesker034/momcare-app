import { PregnancyProfile } from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';
import {
  CreatePregnancyProfileDto,
  UpdatePregnancyProfileDto,
} from './dto/pregnancy-profile.dto';
import {
  PregnancyCalculation,
  calculatePregnancyFromDueDate,
  calculatePregnancyFromCurrentWeek,
  calculatePregnancyFromLastMenstrualPeriod,
} from './pregnancy-calculator';

export interface PregnancyProfileResponse {
  id: string;
  lastMenstrualPeriod: string | null;
  dueDate: string;
  pregnancyWeek: number | null;
  pregnancyDay: number | null;
  trimester: number | null;
  createdAt: string;
  updatedAt: string;
}

const toDateString = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const calculateProfileState = (profile: PregnancyProfile): PregnancyCalculation => {
  if (profile.lastPeriodStartDate) {
    return calculatePregnancyFromLastMenstrualPeriod(profile.lastPeriodStartDate);
  }

  return calculatePregnancyFromDueDate(profile.dueDate);
};

const toResponse = (profile: PregnancyProfile): PregnancyProfileResponse => {
  const calculation = calculateProfileState(profile);

  return {
    id: profile.id,
    lastMenstrualPeriod: toDateString(calculation.lastMenstrualPeriod),
    dueDate: toDateString(calculation.dueDate),
    pregnancyWeek: calculation.pregnancyWeek,
    pregnancyDay: calculation.pregnancyDay,
    trimester: calculation.trimester,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
};

interface PregnancyProfileWriteData {
  lastPeriodStartDate?: Date;
  dueDate?: Date;
  pregnancyWeek: null;
  pregnancyDay: null;
}

const buildProfileData = (
  dto: CreatePregnancyProfileDto | UpdatePregnancyProfileDto,
): PregnancyProfileWriteData => {
  const calculation = dto.currentPregnancyWeek !== undefined
    ? calculatePregnancyFromCurrentWeek(dto.currentPregnancyWeek, dto.currentPregnancyDay)
    : dto.lastMenstrualPeriod
      ? calculatePregnancyFromLastMenstrualPeriod(dto.lastMenstrualPeriod)
      : dto.dueDate ? calculatePregnancyFromDueDate(dto.dueDate) : null;
  if (!calculation) throw new HttpError(400, 'Укажите способ расчёта срока.');
  return {
    lastPeriodStartDate: calculation.lastMenstrualPeriod,
    dueDate: calculation.dueDate,
    // Legacy columns are cleared; the current term is always calculated from dates.
    pregnancyWeek: null,
    pregnancyDay: null,
  };
};

export const getPregnancyProfile = async (
  userId: string,
): Promise<PregnancyProfileResponse | null> => {
  const profile = await prisma.pregnancyProfile.findUnique({
    where: { userId },
  });

  return profile ? toResponse(profile) : null;
};

export const createPregnancyProfile = async (
  userId: string,
  dto: CreatePregnancyProfileDto,
): Promise<PregnancyProfileResponse> => {
  const existingProfile = await prisma.pregnancyProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new HttpError(409, 'Pregnancy profile already exists. Use PATCH to update it.');
  }

  const profileData = buildProfileData(dto);

  if (!profileData.dueDate) {
    throw new HttpError(400, 'lastMenstrualPeriod or dueDate is required');
  }

  const createData = {
    userId,
    dueDate: profileData.dueDate,
    lastPeriodStartDate: profileData.lastPeriodStartDate,
    pregnancyWeek: profileData.pregnancyWeek,
    pregnancyDay: profileData.pregnancyDay,
  };

  const profile = await prisma.pregnancyProfile.create({ data: createData });

  return toResponse(profile);
};

export const updatePregnancyProfile = async (
  userId: string,
  dto: UpdatePregnancyProfileDto,
): Promise<PregnancyProfileResponse> => {
  const existingProfile = await prisma.pregnancyProfile.findUnique({
    where: { userId },
  });

  if (!existingProfile) {
    throw new HttpError(404, 'Pregnancy profile was not found');
  }

  const profile = await prisma.pregnancyProfile.update({
    where: { userId },
    data: buildProfileData(dto),
  });

  return toResponse(profile);
};
