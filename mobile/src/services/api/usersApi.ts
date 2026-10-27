import type { MeResponse } from '../../types/api';
import { apiRequest } from './apiClient';

export function updateCurrentUser(name: string) {
  return apiRequest<MeResponse>('/users/me', { method: 'PATCH', body: { name } });
}
