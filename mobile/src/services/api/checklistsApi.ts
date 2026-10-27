import type {
  ChecklistItemResponse,
  ChecklistItemWriteRequest,
  ChecklistItemsResponse,
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getChecklistByWeek(week: number) {
  return apiRequest<ChecklistItemsResponse>(`/checklists?week=${week}`);
}

export function toggleChecklistItem(id: string) {
  return apiRequest<ChecklistItemResponse>(`/checklists/${id}/toggle`, {
    method: 'PATCH',
  });
}

export function createChecklistItem(payload: ChecklistItemWriteRequest) {
  return apiRequest<ChecklistItemResponse>('/checklists', {
    method: 'POST',
    body: payload,
  });
}

export function updateChecklistItem(id: string, payload: ChecklistItemWriteRequest) {
  return apiRequest<ChecklistItemResponse>(`/checklists/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

// Responses from create/update/toggle are shaped as { item }.

export function deleteChecklistItem(id: string) {
  return apiRequest<void>(`/checklists/${id}`, {
    method: 'DELETE',
  });
}
