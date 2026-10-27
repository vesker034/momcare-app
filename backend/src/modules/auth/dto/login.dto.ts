import { HttpError } from '../../../shared/errors/http-error';

export interface LoginDto {
  email: string;
  password: string;
}

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

const isObject = (value: unknown): value is LoginBody => {
  return typeof value === 'object' && value !== null;
};

export const parseLoginDto = (body: unknown): LoginDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !email.includes('@')) {
    throw new HttpError(400, 'Valid email is required');
  }

  if (!password) {
    throw new HttpError(400, 'Password is required');
  }

  return { email, password };
};
