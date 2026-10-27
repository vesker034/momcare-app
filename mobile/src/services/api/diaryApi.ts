import type {
  CreateDiaryEntryRequest,
  DiaryEntriesResponse,
  DiaryEntryResponse,
  UpdateDiaryEntryRequest,
  DailyTipResponse
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getDiaryEntries() {
  return apiRequest<DiaryEntriesResponse>('/diary');
}

export function getDiaryEntryById(id: string) {
  return apiRequest<DiaryEntryResponse>(`/diary/${id}`);
}

export function createDiaryEntry(payload: CreateDiaryEntryRequest) {
  return apiRequest<DiaryEntryResponse>('/diary', {
    method: 'POST',
    body: payload,
  });
}

export function updateDiaryEntry(id: string, payload: UpdateDiaryEntryRequest) {
  return apiRequest<DiaryEntryResponse>(`/diary/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteDiaryEntry(id: string) {
  return apiRequest<null>(`/diary/${id}`, {
    method: 'DELETE',
  });
}

export function getDiaryEntriesByDate(date: string) {
  return apiRequest<DiaryEntriesResponse>(`/diary?date=${encodeURIComponent(date)}`);
}

export function getDiaryEntriesByDateRange(dateFrom: string, dateTo: string) {
  return apiRequest<DiaryEntriesResponse>(
    `/diary?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
  );
}

export function getDailyTip(date: string) {
  return apiRequest<DailyTipResponse>(
    `/pregnancy-weeks/current/daily-tip?date=${encodeURIComponent(date)}`,
  );
}
