export type CalculationMethod = 'lastPeriod' | 'dueDate' | 'currentWeek';

type DateCalculationMethod = Exclude<CalculationMethod, 'currentWeek'>;

export type DateValidationResult =
  | {
      ok: true;
      date: Date;
      value: string;
    }
  | {
      ok: false;
      error: string;
      value: string;
    };

const maxDateDigits = 8;
const fullDateLength = 10;
const minReasonableYear = 1900;

export function formatPregnancyDateInput(input: string) {
  const sanitizedInput = input.replace(/[^\d.]/g, '');

  if (!sanitizedInput.includes('.')) {
    return formatDigitsOnlyDate(sanitizedInput);
  }

  const parts = sanitizedInput.split('.');
  const dayRaw = (parts[0] ?? '').replace(/\D/g, '').slice(0, 2);
  const monthRaw = (parts[1] ?? '').replace(/\D/g, '').slice(0, 2);
  const yearRaw = parts.slice(2).join('').replace(/\D/g, '').slice(0, 4);
  const hasDaySeparator = parts.length > 1;
  const hasMonthSeparator = parts.length > 2;

  if (!dayRaw) {
    return '';
  }

  const day = hasDaySeparator && dayRaw.length === 1 ? `0${dayRaw}` : dayRaw;
  let result = day;

  if (hasDaySeparator) {
    result += '.';
  }

  if (parts.length > 1) {
    const month =
      hasMonthSeparator && monthRaw.length === 1 ? `0${monthRaw}` : monthRaw;
    result += month;

    if (hasMonthSeparator) {
      result += '.';
      result += yearRaw;
    }
  }

  return result.slice(0, fullDateLength);
}

export function normalizePregnancyDateInput(input: string) {
  return formatPregnancyDateInput(input);
}

export function validatePregnancyDateInput(
  input: string,
  method: DateCalculationMethod,
): DateValidationResult {
  const value = normalizePregnancyDateInput(input);
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return { ok: false, error: 'Укажите дату', value };
  }

  if (digits.length < maxDateDigits || value.length < fullDateLength) {
    return { ok: false, error: 'Введите дату полностью', value };
  }

  const parts = value.split('.');

  if (parts.length !== 3) {
    return { ok: false, error: 'Введите дату в формате дд.мм.гггг', value };
  }

  const [dayRaw, monthRaw, yearRaw] = parts;

  if (!dayRaw || !monthRaw || !yearRaw) {
    return { ok: false, error: 'Введите дату полностью', value };
  }

  if (!/^\d{2}$/.test(dayRaw) || !/^\d{2}$/.test(monthRaw) || !/^\d{4}$/.test(yearRaw)) {
    return { ok: false, error: 'Введите дату в формате дд.мм.гггг', value };
  }

  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  const currentYear = new Date().getFullYear();

  if (day < 1 || day > 31) {
    return { ok: false, error: 'День должен быть от 01 до 31', value };
  }

  if (month < 1 || month > 12) {
    return { ok: false, error: 'Месяц должен быть от 01 до 12', value };
  }

  if (year < minReasonableYear || year > currentYear + 2) {
    return { ok: false, error: 'Введите дату в формате дд.мм.гггг', value };
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { ok: false, error: 'Такой даты не существует', value };
  }

  const today = startOfDay(new Date());
  const normalizedDate = startOfDay(date);

  if (method === 'lastPeriod' && normalizedDate > today) {
    return {
      ok: false,
      error: 'Дата последней менструации не может быть в будущем',
      value,
    };
  }

  if (method === 'dueDate') {
    const earliestDueDate = addDays(today, -30);
    const latestDueDate = addDays(today, 315);

    if (normalizedDate < earliestDueDate || normalizedDate > latestDueDate) {
      return { ok: false, error: 'Проверьте предполагаемую дату родов', value };
    }
  }

  return { ok: true, date: normalizedDate, value };
}

function formatDigitsOnlyDate(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, maxDateDigits);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) {
    return day;
  }

  if (digits.length <= 4) {
    return `${day}.${month}`;
  }

  return `${day}.${month}.${year}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDay(nextDate);
}
