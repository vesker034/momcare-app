import type {
  PregnancyWeekContentResponse,
  PregnancyWeeksResponse,
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getPregnancyWeeks(trimester?: number) {
  const query =
    trimester === undefined ? '' : `?trimester=${encodeURIComponent(String(trimester))}`;

  return apiRequest<PregnancyWeeksResponse>(`/pregnancy-weeks${query}`);
}

export function getPregnancyWeekContent(week: number) {
  return apiRequest<PregnancyWeekContentResponse>(`/pregnancy-weeks/${week}`);
}

export function getCurrentPregnancyWeekContent() {
  return apiRequest<PregnancyWeekContentResponse>('/pregnancy-weeks/current');
}
