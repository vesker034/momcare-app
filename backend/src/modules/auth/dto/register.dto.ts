import { HttpError } from '../../../shared/errors/http-error';

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  name?: unknown;
}

const isObject = (value: unknown): value is RegisterBody => {
  return typeof value === 'object' && value !== null;
};

export const parseRegisterDto = (body: unknown): RegisterDto => {
  if (!isObject(body)) {
    throw new HttpError(400, 'Request body must be an object');
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;

  if (!email || !email.includes('@')) {
    throw new HttpError(400, 'Valid email is required');
  }

  if (password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters long');
  }

  return {
    email,
    password,
    ...(name ? { name } : {}),
  };
};
