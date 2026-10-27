import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import {
  DiaryDateFilter,
  createDiaryEntry,
  deleteDiaryEntry,
  getDiaryEntries,
  getDiaryEntry,
  updateDiaryEntry,
} from './diary.service';
import {
  parseCreateDiaryEntryDto,
  parseDateOnly,
  parseUpdateDiaryEntryDto,
} from './dto/diary-entry.dto';

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
    throw new HttpError(400, 'Diary entry id is required');
  }

  return id;
};

const parseDateQueryParam = (value: unknown, field: string): Date | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(400, `${field} must be in YYYY-MM-DD format`);
  }

  return parseDateOnly(value, field);
};

const parseDateFilter = (request: Request): DiaryDateFilter => {
  const query = request.query as Record<string, unknown>;
  const date = parseDateQueryParam(query.date, 'date');
  const dateFrom = parseDateQueryParam(query.dateFrom, 'dateFrom') ?? date;
  const dateTo = parseDateQueryParam(query.dateTo, 'dateTo') ?? date;

  if (dateFrom !== undefined && dateTo !== undefined && dateFrom.getTime() > dateTo.getTime()) {
    throw new HttpError(400, 'dateFrom must not be later than dateTo');
  }

  return {
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };
};

export const createDiaryRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const entries = await getDiaryEntries(userId, parseDateFilter(request));

      response.json({ entries });
    }),
  );

  router.get(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const entry = await getDiaryEntry(userId, getRouteId(request));

      response.json({ entry });
    }),
  );

  router.post(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseCreateDiaryEntryDto(request.body);
      const entry = await createDiaryEntry(userId, dto);

      response.status(201).json({ entry });
    }),
  );

  router.patch(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseUpdateDiaryEntryDto(request.body);
      const entry = await updateDiaryEntry(userId, getRouteId(request), dto);

      response.json({ entry });
    }),
  );

  router.delete(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);

      await deleteDiaryEntry(userId, getRouteId(request));
      response.status(204).send();
    }),
  );

  return router;
};
