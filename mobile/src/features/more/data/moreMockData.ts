import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type MoreTool = {
  id: string;
  title: string;
  icon: IconName;
  tone: 'peach' | 'lavender' | 'rose';
  route: string;
};

export type MoreListItem = {
  id: string;
  title: string;
  icon: IconName;
  route: string;
};

export const moreTools: MoreTool[] = [
  {
    id: 'nutrition',
    title: 'Питание',
    icon: 'silverware-fork-knife',
    tone: 'peach',
    route: '/tabs/more/nutrition',
  },
  {
    id: 'activity',
    title: 'Активность',
    icon: 'dumbbell',
    tone: 'lavender',
    route: '/tabs/more/activity',
  },
  {
    id: 'checklists',
    title: 'Чек-листы',
    icon: 'format-list-checks',
    tone: 'rose',
    route: '/tabs/more/checklists?source=more',
  },
  {
    id: 'knowledge',
    title: 'База знаний',
    icon: 'book-open-page-variant-outline',
    tone: 'peach',
    route: '/tabs/more/knowledge',
  },
  {
    id: 'trackers',
    title: 'Трекеры',
    icon: 'chart-line',
    tone: 'lavender',
    route: '/tabs/more/trackers',
  },
];

export const myDataItems: MoreListItem[] = [
  {
    id: 'documents',
    title: 'Документы и анализы',
    icon: 'file-document-outline',
    route: '/tabs/more/documents',
  },
  {
    id: 'favorites',
    title: 'Избранное',
    icon: 'heart',
    route: '/tabs/more/favorites',
  },
  {
    id: 'profile',
    title: 'Профиль',
    icon: 'account-outline',
    route: '/tabs/more/profile',
  },
];

export const appItems: MoreListItem[] = [
  {
    id: 'settings',
    title: 'Настройки',
    icon: 'cog-outline',
    route: '/tabs/more/settings',
  },
  {
    id: 'support',
    title: 'Помощь и поддержка',
    icon: 'help-circle-outline',
    route: '/tabs/more/support',
  },
];
