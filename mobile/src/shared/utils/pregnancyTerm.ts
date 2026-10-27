function formIndex(value: number): 0 | 1 | 2 {
  const count = Math.abs(value);
  if (count % 100 >= 11 && count % 100 <= 14) return 2;
  if (count % 10 === 1) return 0;
  if (count % 10 >= 2 && count % 10 <= 4) return 1;
  return 2;
}

export function formatWeeks(value: number): string {
  return `${value} ${['неделя', 'недели', 'недель'][formIndex(value)]}`;
}

export function formatDays(value: number): string {
  return `${value} ${['день', 'дня', 'дней'][formIndex(value)]}`;
}

export function formatPregnancyTerm(weeks: number, days?: number): string {
  return days === undefined ? formatWeeks(weeks) : `${formatWeeks(weeks)} ${formatDays(days)}`;
}

export function formatDaysRemaining(days: number): string {
  return `${formIndex(days) === 0 ? 'Остался' : 'Осталось'} ${formatDays(days)}`;
}

export function formatWeeksRemaining(weeks: number): string {
  return `${formIndex(weeks) === 0 ? 'Осталась' : 'Осталось'} ${formatWeeks(weeks)}`;
}

// A selected calendar week is an ordinal, rather than a duration.
export function formatPregnancyWeekTitle(week: number): string {
  return `${week}-я неделя`;
}
