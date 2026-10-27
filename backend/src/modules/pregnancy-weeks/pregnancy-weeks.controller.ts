import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { parseDateOnly, todayDateOnlyString } from '../../shared/dates/date-only';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import {
  getCurrentWeekContent,
  getDailyTip,
  getPregnancyWeekContent,
  listPregnancyWeekSummaries,
  parseTrimester,
} from './pregnancy-weeks.service';

const getAuthenticatedUserId = (request: Request): string => {
  const user = (request as Partial<AuthenticatedRequest>).user;

  if (!user) {
    throw new HttpError(401, 'Invalid or missing token');
  }

  return user.id;
};

const parseWeekParam = (request: Request): number => {
  const week = Number(request.params.week);

  if (!Number.isInteger(week) || week < 1 || week > 42) {
    throw new HttpError(400, 'week must be an integer from 1 to 42');
  }

  return week;
};

const parseDateQuery = (request: Request): Date => {
  const value = request.query.date;

  if (value === undefined) {
    return parseDateOnly(todayDateOnlyString(), 'date');
  }

  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(400, 'date must be in YYYY-MM-DD format');
  }

  return parseDateOnly(value, 'date');
};

export const createPregnancyWeeksRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const weeks = await listPregnancyWeekSummaries({
        trimester: parseTrimester(request.query.trimester),
      });

      response.json({ weeks });
    }),
  );

  router.get(
    '/current',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const content = await getCurrentWeekContent(getAuthenticatedUserId(request));

      response.json({ content });
    }),
  );

  router.get(
    '/current/daily-tip',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const dailyTip = await getDailyTip(
        getAuthenticatedUserId(request),
        parseDateQuery(request),
      );

      response.json(dailyTip);
    }),
  );

  router.get(
    '/:week',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const content = await getPregnancyWeekContent(parseWeekParam(request));

      response.json({ content });
    }),
  );

  return router;
};
