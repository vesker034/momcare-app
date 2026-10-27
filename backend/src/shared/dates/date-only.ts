import { HttpError } from '../errors/http-error';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a calendar date in `YYYY-MM-DD` format into a UTC `Date` at midnight.
 * The value is treated as the user's local calendar day, not as a server timezone.
 */
export const parseDateOnly = (value: string, field: string): Date => {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new HttpError(400, `${field} must be in YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field} must be a valid calendar date`);
  }

  return date;
};

/**
 * Returns the UTC calendar day of a date as `YYYY-MM-DD`.
 */
export const toDateOnlyString = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

/**
 * Returns the current UTC calendar day as `YYYY-MM-DD`.
 */
export const todayDateOnlyString = (now: Date = new Date()): string => {
  return toDateOnlyString(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
};
