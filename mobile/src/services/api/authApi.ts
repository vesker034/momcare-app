import type { AuthResponse, MeResponse } from '../../types/api';
import { apiRequest } from './apiClient';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    authorized: false,
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    authorized: false,
  });
}

export function me() {
  return apiRequest<MeResponse>('/auth/me');
}
