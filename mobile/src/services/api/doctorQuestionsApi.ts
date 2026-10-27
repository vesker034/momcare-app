import type {
  CreateDoctorQuestionRequest,
  DoctorQuestionResponse,
  DoctorQuestionsResponse,
  UpdateDoctorQuestionRequest,
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getDoctorQuestions() {
  return apiRequest<DoctorQuestionsResponse>('/doctor-questions');
}

export function getDoctorQuestionById(id: string) {
  return apiRequest<DoctorQuestionResponse>(`/doctor-questions/${id}`);
}

export function createDoctorQuestion(payload: CreateDoctorQuestionRequest) {
  return apiRequest<DoctorQuestionResponse>('/doctor-questions', {
    method: 'POST',
    body: payload,
  });
}

export function updateDoctorQuestion(
  id: string,
  payload: UpdateDoctorQuestionRequest,
) {
  return apiRequest<DoctorQuestionResponse>(`/doctor-questions/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteDoctorQuestion(id: string) {
  return apiRequest<null>(`/doctor-questions/${id}`, {
    method: 'DELETE',
  });
}
