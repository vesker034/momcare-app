import type {
  CreateVisitRequest,
  UpdateVisitRequest,
  VisitResponse,
  VisitsResponse,
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getVisits() {
  return apiRequest<VisitsResponse>('/visits');
}

export function getUpcomingVisits() {
  return apiRequest<VisitsResponse>('/visits/upcoming');
}

export function getVisitById(id: string) {
  return apiRequest<VisitResponse>(`/visits/${id}`);
}

export function createVisit(payload: CreateVisitRequest) {
  return apiRequest<VisitResponse>('/visits', {
    method: 'POST',
    body: payload,
  });
}

export function updateVisit(id: string, payload: UpdateVisitRequest) {
  return apiRequest<VisitResponse>(`/visits/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteVisit(id: string) {
  return apiRequest<null>(`/visits/${id}`, {
    method: 'DELETE',
  });
}
