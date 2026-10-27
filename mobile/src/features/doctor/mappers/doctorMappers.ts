import type {
  DoctorQuestionStatus,
  Visit,
  VisitStatus,
} from '../../../types/api';

export const visitStatusLabels: Record<VisitStatus, string> = {
  PLANNED: 'Запланирован',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const doctorQuestionStatusLabels: Record<DoctorQuestionStatus, string> = {
  NEW: 'Новый',
  ANSWERED: 'Отвечен',
  ARCHIVED: 'В архиве',
};

export function formatVisitDate(value: string) {
  return formatDate(value, {
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortDate(value: string) {
  return formatDate(value, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatVisitDateTime(visit: Visit) {
  const date = formatVisitDate(visit.date);

  return visit.time ? `${date}, ${visit.time}` : date;
}

export function toApiDateFromRuInput(value: string) {
  const [day, month, year] = value.split('.');

  return `${year}-${month}-${day}`;
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
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

export function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  const hours = digits.slice(0, 2);
  const minutes = digits.slice(2, 4);

  if (digits.length <= 2) {
    return hours;
  }

  return `${hours}:${minutes}`;
}

export function validateDateInput(value: string) {
  if (!value.trim()) {
    return 'Укажите дату';
  }

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    return 'Введите дату в формате дд.мм.гггг';
  }

  const [dayRaw, monthRaw, yearRaw] = value.split('.');
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return 'Такой даты не существует';
  }

  return '';
}

export function validateTimeInput(value: string) {
  if (!value.trim()) {
    return '';
  }

  if (!/^\d{2}:\d{2}$/.test(value)) {
    return 'Введите время в формате чч:мм';
  }

  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (hours > 23 || minutes > 59) {
    return 'Проверьте время';
  }

  return '';
}

function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('ru-RU', options).format(date);
}
