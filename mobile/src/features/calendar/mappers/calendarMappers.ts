import type { ArticleCategory, ChecklistCategory } from '../../../types/api';

export const articleCategoryLabels: Record<ArticleCategory, string> = {
  PREGNANCY: 'Беременность',
  NUTRITION: 'Питание',
  ACTIVITY: 'Активность',
  CHECKLISTS: 'Чек-листы',
  DOCTOR: 'Врач',
};

export const checklistCategoryLabels: Record<ChecklistCategory, string> = {
  DOCUMENTS: 'Документы',
  HEALTH: 'Здоровье',
  DOCTOR: 'Врач',
  HOSPITAL_BAG: 'Сумка в роддом',
  BABY: 'Малыш',
  OTHER: 'Другое',
};

export function getTrimesterId(week: number): 1 | 2 | 3 {
  if (week <= 13) {
    return 1;
  }

  if (week <= 26) {
    return 2;
  }

  return 3;
}

export function getTrimesterLabel(week: number) {
  const trimester = getTrimesterId(week);

  if (trimester === 1) {
    return 'I триместр';
  }

  if (trimester === 2) {
    return 'II триместр';
  }

  return 'III триместр';
}

export function calculateDaysUntilDueDate(dueDate: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = dueDate.split('-').map(Number);
  const dueDateStart = new Date(year, month - 1, day);
  const dayInMs = 24 * 60 * 60 * 1000;

  return Math.max(
    Math.ceil((dueDateStart.getTime() - todayStart.getTime()) / dayInMs),
    0,
  );
}

export function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
