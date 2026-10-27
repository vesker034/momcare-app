import { HttpError } from '../../../shared/errors/http-error';

export interface CreatePregnancyProfileDto {
  lastMenstrualPeriod?: Date;
  dueDate?: Date;
  currentPregnancyWeek?: number;
  currentPregnancyDay?: number;
}
export type UpdatePregnancyProfileDto = CreatePregnancyProfileDto;

function parseDate(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${field}: укажите дату в формате YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field}: такой даты не существует.`);
  }
  return date;
}

function parseProfile(body: unknown): CreatePregnancyProfileDto {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Тело запроса должно быть объектом.');
  }
  const data = body as Record<string, unknown>;
  const allowed = ['lastMenstrualPeriod', 'dueDate', 'currentPregnancyWeek', 'currentPregnancyDay'];
  if (Object.keys(data).some(key => !allowed.includes(key))) {
    throw new HttpError(400, 'Переданы неподдерживаемые поля профиля.');
  }
  const has = (key: string) => Object.prototype.hasOwnProperty.call(data, key);
  const methods = ['lastMenstrualPeriod', 'dueDate', 'currentPregnancyWeek'].filter(has);
  if (methods.length !== 1 || (has('currentPregnancyDay') && !has('currentPregnancyWeek'))) {
    throw new HttpError(400, 'Укажите ровно один способ: дату менструации, дату родов или текущий срок.');
  }
  if (has('currentPregnancyWeek')) {
    const week = data.currentPregnancyWeek;
    const day = has('currentPregnancyDay') ? data.currentPregnancyDay : 0;
    if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > 42) {
      throw new HttpError(400, 'Неделя беременности должна быть целым числом от 1 до 42.');
    }
    if (typeof day !== 'number' || !Number.isInteger(day) || day < 0 || day > 6) {
      throw new HttpError(400, 'День недели должен быть целым числом от 0 до 6.');
    }
    return { currentPregnancyWeek: week, currentPregnancyDay: day };
  }
  if (has('lastMenstrualPeriod')) {
    return { lastMenstrualPeriod: parseDate(data.lastMenstrualPeriod, 'lastMenstrualPeriod') };
  }
  return { dueDate: parseDate(data.dueDate, 'dueDate') };
}

export const parseCreatePregnancyProfileDto = parseProfile;
export const parseUpdatePregnancyProfileDto = parseProfile;
