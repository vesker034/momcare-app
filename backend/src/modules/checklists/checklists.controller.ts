import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import {
  createPersonalChecklistItem,
  deletePersonalChecklistItem,
  getChecklistItemsByWeek,
  parseChecklistWriteInput,
  toggleChecklistItem,
  updatePersonalChecklistItem,
} from './checklists.service';

const getAuthenticatedUserId = (request: Request): string => {
  const user = (request as Partial<AuthenticatedRequest>).user;

  if (!user) {
    throw new HttpError(401, 'Invalid or missing token');
  }

  return user.id;
};

const parseWeekQuery = (request: Request): number => {
  const weekRaw = request.query.week;
  const week = typeof weekRaw === 'string' ? Number(weekRaw) : Number.NaN;

  if (!Number.isInteger(week) || week < 1 || week > 42) {
    throw new HttpError(400, 'week query parameter must be an integer from 1 to 42');
  }

  return week;
};

const getRouteId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new HttpError(400, 'Checklist item id is required');
  }

  return id;
};

export const createChecklistsRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const items = await getChecklistItemsByWeek(userId, parseWeekQuery(request));

      response.json({ items });
    }),
  );

  router.post(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const item = await createPersonalChecklistItem(
        userId,
        parseChecklistWriteInput(request.body),
      );

      response.status(201).json({ item });
    }),
  );

  router.patch(
    '/:id/toggle',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const item = await toggleChecklistItem(userId, getRouteId(request));

      response.json({ item });
    }),
  );

  router.patch(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const item = await updatePersonalChecklistItem(
        userId,
        getRouteId(request),
        parseChecklistWriteInput(request.body),
      );

      response.json({ item });
    }),
  );

  router.delete(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      await deletePersonalChecklistItem(userId, getRouteId(request));

      response.status(204).send();
    }),
  );

  return router;
};
