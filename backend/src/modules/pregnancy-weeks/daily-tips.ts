import * as fs from 'fs';
import * as path from 'path';

import { toDateOnlyString } from '../../shared/dates/date-only';
import {
  calculatePregnancyFromDueDate,
  calculatePregnancyFromLastMenstrualPeriod,
} from '../pregnancy-profile/pregnancy-calculator';

export const MIN_PREGNANCY_WEEK = 1;
export const MAX_PREGNANCY_WEEK = 42;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface DailyTip {
  title: string;
  text: string;
}

export interface DailyTipResponse {
  date: string;
  pregnancyWeek: number | null;
  title: string;
  text: string;
  isGeneral: boolean;
}

export interface PregnancyProfileForTips {
  lastPeriodStartDate: Date | null;
  dueDate: Date;
}

interface WeekContentRecord {
  week: number;
  dailyTips?: DailyTip[];
}

/**
 * Safe, neutral fallback for users without a resolvable pregnancy term. It does
 * not contain a diagnosis, prescription, or promised medical outcome.
 */
export const GENERAL_DAILY_TIP: DailyTip = {
  title: 'Спокойный ритм дня',
  text: 'Уделите сегодня немного времени отдыху и наблюдайте за самочувствием. При появлении вопросов о здоровье обсудите их с врачом.',
};

let tipsByWeekCache: Map<number, DailyTip[]> | null = null;

const getTipsFilePath = (): string => {
  // `prisma/info_of_weeks.json` is three levels up from both
  // `src/modules/pregnancy-weeks` (ts-node) and `dist/modules/pregnancy-weeks`.
  return path.resolve(__dirname, '../../../prisma/info_of_weeks.json');
};

const loadTipsByWeek = (): Map<number, DailyTip[]> => {
  if (tipsByWeekCache) {
    return tipsByWeekCache;
  }

  const rawContent = fs.readFileSync(getTipsFilePath(), 'utf-8');
  const weekRecords = JSON.parse(rawContent) as WeekContentRecord[];
  const tipsByWeek = new Map<number, DailyTip[]>();

  for (const record of weekRecords) {
    if (Array.isArray(record.dailyTips) && record.dailyTips.length > 0) {
      tipsByWeek.set(
        record.week,
        record.dailyTips.map((tip) => ({ title: tip.title, text: tip.text })),
      );
    }
  }

  tipsByWeekCache = tipsByWeek;
  return tipsByWeek;
};

/**
 * Returns the full list of tips configured for a week (empty when the week is
 * not covered by the reference data).
 */
export const getDailyTipsForWeek = (week: number): DailyTip[] => {
  return loadTipsByWeek().get(week) ?? [];
};

const toUtcDayNumber = (date: Date): number => {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_IN_MS,
  );
};

/**
 * Deterministically picks one tip for a pregnancy week and calendar date.
 *
 * The calendar day number acts as a stable index, so the same week and date
 * always return the same tip, while neighboring dates move to the next tip and
 * do not repeat it (each week has more than one tip). No randomness is used.
 */
export const selectDailyTip = (
  week: number,
  date: Date,
  tipsByWeek: Map<number, DailyTip[]> = loadTipsByWeek(),
): DailyTip | null => {
  const tips = tipsByWeek.get(week);

  if (!tips || tips.length === 0) {
    return null;
  }

  const dayNumber = toUtcDayNumber(date);
  const index = ((dayNumber % tips.length) + tips.length) % tips.length;

  return tips[index];
};

/**
 * Resolves the daily tip contract:
 * - a known week returns the date-specific tip for that week;
 * - a missing profile or an unresolvable/out-of-range term returns a safe
 *   general tip with `pregnancyWeek: null` and `isGeneral: true`.
 */
export const resolveDailyTip = (params: {
  date: Date;
  profile: PregnancyProfileForTips | null;
}): DailyTipResponse => {
  const date = toDateOnlyString(params.date);

  if (!params.profile) {
    return {
      date,
      pregnancyWeek: null,
      ...GENERAL_DAILY_TIP,
      isGeneral: true,
    };
  }

  const calculation = params.profile.lastPeriodStartDate
    ? calculatePregnancyFromLastMenstrualPeriod(params.profile.lastPeriodStartDate, params.date)
    : calculatePregnancyFromDueDate(params.profile.dueDate, params.date);

  const week = calculation.pregnancyWeek;

  if (week < MIN_PREGNANCY_WEEK || week > MAX_PREGNANCY_WEEK) {
    return {
      date,
      pregnancyWeek: null,
      ...GENERAL_DAILY_TIP,
      isGeneral: true,
    };
  }

  const tip = selectDailyTip(week, params.date);

  if (!tip) {
    return {
      date,
      pregnancyWeek: week,
      ...GENERAL_DAILY_TIP,
      isGeneral: true,
    };
  }

  return {
    date,
    pregnancyWeek: week,
    title: tip.title,
    text: tip.text,
    isGeneral: false,
  };
};
