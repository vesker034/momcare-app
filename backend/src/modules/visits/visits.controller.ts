import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import { parseCreateVisitDto, parseUpdateVisitDto } from './dto/visit.dto';
import {
  createVisit,
  deleteVisit,
  getUpcomingVisits,
  getVisit,
  getVisits,
  updateVisit,
} from './visits.service';

const getAuthenticatedUserId = (request: Request): string => {
  const user = (request as Partial<AuthenticatedRequest>).user;

  if (!user) {
    throw new HttpError(401, 'Invalid or missing token');
  }

  return user.id;
};

const getRouteId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new HttpError(400, 'Visit id is required');
  }

  return id;
};

export const createVisitsRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const visits = await getVisits(userId);

      response.json({ visits });
    }),
  );

  router.get(
    '/upcoming',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const visits = await getUpcomingVisits(userId);

      response.json({ visits });
    }),
  );

  router.get(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const visit = await getVisit(userId, getRouteId(request));

      response.json({ visit });
    }),
  );

  router.post(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseCreateVisitDto(request.body);
      const visit = await createVisit(userId, dto);

      response.status(201).json({ visit });
    }),
  );

  router.patch(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseUpdateVisitDto(request.body);
      const visit = await updateVisit(userId, getRouteId(request), dto);

      response.json({ visit });
    }),
  );

  router.delete(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);

      await deleteVisit(userId, getRouteId(request));
      response.status(204).send();
    }),
  );

  return router;
};
