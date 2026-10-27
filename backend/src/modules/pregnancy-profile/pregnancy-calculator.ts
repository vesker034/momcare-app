import { HttpError } from '../../shared/errors/http-error';

const PREGNANCY_DURATION_DAYS = 280;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface PregnancyCalculation {
  lastMenstrualPeriod: Date;
  dueDate: Date;
  pregnancyWeek: number;
  pregnancyDay: number;
  trimester: number;
}

const toUtcDateOnly = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * DAY_IN_MS);
};

const getFullDaysBetween = (startDate: Date, endDate: Date): number => {
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_IN_MS);
};

export const calculateTrimester = (pregnancyWeek: number): number => {
  if (pregnancyWeek <= 13) {
    return 1;
  }

  if (pregnancyWeek <= 27) {
    return 2;
  }

  return 3;
};

const calculateFromLastMenstrualPeriod = (
  lastMenstrualPeriod: Date,
  currentDate: Date,
): PregnancyCalculation => {
  const normalizedLastMenstrualPeriod = toUtcDateOnly(lastMenstrualPeriod);
  const normalizedCurrentDate = toUtcDateOnly(currentDate);

  if (normalizedLastMenstrualPeriod.getTime() > normalizedCurrentDate.getTime()) {
    throw new HttpError(400, 'lastMenstrualPeriod cannot be in the future');
  }

  const pregnancyDaysTotal = getFullDaysBetween(
    normalizedLastMenstrualPeriod,
    normalizedCurrentDate,
  );
  const completedWeeks = Math.floor(pregnancyDaysTotal / 7);
  const pregnancyWeek = completedWeeks + 1;
  const pregnancyDay = pregnancyDaysTotal % 7;

  return {
    lastMenstrualPeriod: normalizedLastMenstrualPeriod,
    dueDate: addDays(normalizedLastMenstrualPeriod, PREGNANCY_DURATION_DAYS),
    pregnancyWeek,
    pregnancyDay,
    trimester: calculateTrimester(pregnancyWeek),
  };
};

export const calculatePregnancyFromLastMenstrualPeriod = (
  lastMenstrualPeriod: Date,
  currentDate = new Date(),
): PregnancyCalculation => {
  return calculateFromLastMenstrualPeriod(lastMenstrualPeriod, currentDate);
};

export const calculatePregnancyFromDueDate = (
  dueDate: Date,
  currentDate = new Date(),
): PregnancyCalculation => {
  const normalizedDueDate = toUtcDateOnly(dueDate);
  const lastMenstrualPeriod = addDays(normalizedDueDate, -PREGNANCY_DURATION_DAYS);

  return calculateFromLastMenstrualPeriod(lastMenstrualPeriod, currentDate);
};

export const calculatePregnancyFromCurrentWeek = (
  week: number,
  day = 0,
  currentDate = new Date(),
): PregnancyCalculation => {
  if (!Number.isInteger(week) || week < 1 || week > 42 ||
      !Number.isInteger(day) || day < 0 || day > 6) {
    throw new HttpError(400, 'Неделя должна быть от 1 до 42, день — от 0 до 6.');
  }
  // Match the existing API: the first week starts at day zero.
  const elapsedDays = (week - 1) * 7 + day;
  return calculateFromLastMenstrualPeriod(addDays(toUtcDateOnly(currentDate), -elapsedDays), currentDate);
};
