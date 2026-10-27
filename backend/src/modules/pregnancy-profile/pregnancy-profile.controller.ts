import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import {
  parseCreatePregnancyProfileDto,
  parseUpdatePregnancyProfileDto,
} from './dto/pregnancy-profile.dto';
import {
  createPregnancyProfile,
  getPregnancyProfile,
  updatePregnancyProfile,
} from './pregnancy-profile.service';

const getAuthenticatedUserId = (request: Request): string => {
  const user = (request as Partial<AuthenticatedRequest>).user;

  if (!user) {
    throw new HttpError(401, 'Invalid or missing token');
  }

  return user.id;
};

export const createPregnancyProfileRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const profile = await getPregnancyProfile(userId);

      response.json({ profile });
    }),
  );

  router.post(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseCreatePregnancyProfileDto(request.body);
      const profile = await createPregnancyProfile(userId, dto);

      response.status(201).json({ profile });
    }),
  );

  router.patch(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseUpdatePregnancyProfileDto(request.body);
      const profile = await updatePregnancyProfile(userId, dto);

      response.json({ profile });
    }),
  );

  return router;
};
