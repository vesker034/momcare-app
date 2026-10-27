import { HttpError } from '../../../shared/errors/http-error';

export function parseUpdateUserDto(body: unknown): { name: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Тело запроса должно быть объектом.');
  }
  if (Object.keys(body).some((key) => key !== 'name')) {
    throw new HttpError(400, 'Можно изменить только имя.');
  }
  const name = 'name' in body && typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 60) {
    throw new HttpError(400, 'Имя должно содержать от 2 до 60 символов.');
  }
  return { name };
}
