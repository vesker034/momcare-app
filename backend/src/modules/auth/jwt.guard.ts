import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

import { getEnv } from '../../config/env';
import { HttpError } from '../../shared/errors/http-error';
import { AuthenticatedUser, JwtPayload } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

const isJwtPayload = (payload: unknown): payload is JwtPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Partial<JwtPayload>;

  return typeof candidate.sub === 'string' && typeof candidate.email === 'string';
};

export const jwtGuard: RequestHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const authorizationHeader = request.header('authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Invalid or missing token'));
    return;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, getEnv('JWT_ACCESS_SECRET'));

    if (!isJwtPayload(payload)) {
      next(new HttpError(401, 'Invalid or missing token'));
      return;
    }

    (request as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch {
    next(new HttpError(401, 'Invalid or missing token'));
  }
};
