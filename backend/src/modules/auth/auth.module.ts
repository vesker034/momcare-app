import { Express, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { findPublicUserById } from '../users/users.service';
import { loginUser, registerUser } from './auth.service';
import { parseLoginDto } from './dto/login.dto';
import { parseRegisterDto } from './dto/register.dto';
import { AuthenticatedRequest, jwtGuard } from './jwt.guard';

const isAuthenticatedRequest = (request: unknown): request is AuthenticatedRequest => {
  return (
    typeof request === 'object' &&
    request !== null &&
    'user' in request &&
    typeof (request as AuthenticatedRequest).user.id === 'string'
  );
};

export const registerAuthModule = (app: Express): void => {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (request, response) => {
      const dto = parseRegisterDto(request.body);
      const result = await registerUser(dto);

      response.status(201).json(result);
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (request, response) => {
      const dto = parseLoginDto(request.body);
      const result = await loginUser(dto);

      response.json(result);
    }),
  );

  router.get(
    '/me',
    jwtGuard,
    asyncHandler(async (request, response) => {
      if (!isAuthenticatedRequest(request)) {
        throw new HttpError(401, 'Invalid or missing token');
      }

      const user = await findPublicUserById(request.user.id);

      if (!user) {
        throw new HttpError(401, 'Invalid or missing token');
      }

      response.json({ user });
    }),
  );

  app.use('/auth', router);
};
