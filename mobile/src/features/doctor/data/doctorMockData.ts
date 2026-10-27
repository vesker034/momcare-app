import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type DoctorVisit = {
  id: string;
  title: string;
  time: string;
  location: string;
};

export type DoctorQuestion = {
  id: string;
  text: string;
  addedAt: string;
  tone: 'rose' | 'lavender';
};

export type DoctorEvent = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  tone: 'lavender' | 'peach';
};

export type DoctorReport = {
  id: string;
  fileName: string;
  createdAt: string;
};

export const nextDoctorVisit: DoctorVisit = {
  id: 'gynecologist-visit',
  title: 'Прием гинеколога',
  time: 'Завтра, 10:30',
  location: 'Клиника «Мать и Дитя», каб. 302',
};

export const doctorQuestions: DoctorQuestion[] = [
  {
    id: 'yoga-third-trimester',
    text: 'Можно ли продолжать занятия йогой в 3 триместре?',
    addedAt: 'Добавлен 2 дня назад',
    tone: 'rose',
  },
  {
    id: 'hemoglobin-iron-dose',
    text: 'Показатели гемоглобина: нужно ли менять дозировку железа?',
    addedAt: 'Добавлен вчера',
    tone: 'lavender',
  },
];

export const doctorEvents: DoctorEvent[] = [
  {
    id: 'blood-test',
    title: 'Клинический анализ крови',
    subtitle: '22 октября • Натощак',
    icon: 'microscope',
    tone: 'lavender',
  },
  {
    id: 'second-trimester-screening',
    title: 'Скрининг II триместра (УЗИ)',
    subtitle: '25 октября • 12:00',
    icon: 'eye-outline',
    tone: 'peach',
  },
];

export const doctorReports: DoctorReport[] = [
  {
    id: 'week-22-report',
    fileName: 'Отчет_22_недели.pdf',
    createdAt: 'Сформирован 14.10.2023',
  },
  {
    id: 'week-20-report',
    fileName: 'Отчет_20_недели.pdf',
    createdAt: 'Сформирован 30.09.2023',
  },
];
