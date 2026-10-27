import type {
  PregnancyProfilePayload,
  PregnancyProfileResponse,
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getPregnancyProfile() {
  return apiRequest<PregnancyProfileResponse>('/pregnancy-profile');
}

export function createPregnancyProfile(payload: PregnancyProfilePayload) {
  return apiRequest<PregnancyProfileResponse>('/pregnancy-profile', {
    method: 'POST',
    body: payload,
  });
}

export function updatePregnancyProfile(payload: PregnancyProfilePayload) {
  return apiRequest<PregnancyProfileResponse>('/pregnancy-profile', {
    method: 'PATCH',
    body: payload,
  });
}
