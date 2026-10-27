import { API_BASE_URL } from '../../config/env';
import { clearAccessToken, getAccessToken } from '../authTokenStorage';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  authorized?: boolean;
};

type ApiErrorPayload = {
  message?: string;
};

let unauthorizedHandler: (() => void) | null = null;

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const { method = 'GET', body, authorized = true } = options;
  const headers = new Headers();

  headers.set('Accept', 'application/json');

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (authorized) {
    const token = await getAccessToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Не удалось подключиться к серверу. Проверьте, что приложение может достучаться до него.');
  }

  const text = await response.text();
  const payload = text ? parseJson(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      await clearAccessToken();
      unauthorizedHandler?.();
    }

    throw new ApiError(
      response.status,
      getErrorMessage(payload, response.status),
      payload,
    );
  }

  if (response.status === 204 || payload === null) {
    return undefined as TResponse;
  }

  return payload as TResponse;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(0, 'Сервер вернул некорректный JSON');
  }
}

function getErrorMessage(payload: unknown, status: number) {
  if (isApiErrorPayload(payload) && payload.message) {
    return payload.message;
  }

  if (status === 0) {
    return 'Не удалось подключиться к серверу';
  }

  return 'Произошла ошибка. Попробуйте ещё раз.';
}

function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof (payload as ApiErrorPayload).message === 'string'
  );
}
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    const direct = e.status;
    const alt = e.statusCode;
    const response = e.response;
    const fromResponse =
      typeof response === 'object' && response !== null
        ? (response as Record<string, unknown>).status
        : undefined;

    if (typeof direct === 'number') return direct;
    if (typeof alt === 'number') return alt;
    if (typeof fromResponse === 'number') return fromResponse;
  }
  return undefined;
}

export function getErrorEntryId(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    const direct = e.entryId;
    const data = e.data;
    const fromData =
      typeof data === 'object' && data !== null
        ? (data as Record<string, unknown>).entryId
        : undefined;
    const response = e.response;
    const fromResponseData =
      typeof response === 'object' && response !== null
        ? (() => {
          const r = response as Record<string, unknown>;
          const rd = r.data;
          return typeof rd === 'object' && rd !== null
            ? (rd as Record<string, unknown>).entryId
            : undefined;
        })()
        : undefined;

    if (typeof direct === 'string') return direct;
    if (typeof fromData === 'string') return fromData;
    if (typeof fromResponseData === 'string') return fromResponseData;
  }
  return undefined;
}
