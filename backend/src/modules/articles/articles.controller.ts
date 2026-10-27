import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { jwtGuard } from '../auth/jwt.guard';
import {
  getArticle,
  getArticles,
  parseArticleCategory,
  parsePregnancyWeek,
} from './articles.service';

const getRouteId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new HttpError(400, 'Article id is required');
  }

  return id;
};

export const createArticlesRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const articles = await getArticles({
        category: parseArticleCategory(request.query.category),
        pregnancyWeek: parsePregnancyWeek(request.query.pregnancyWeek),
      });

      response.json({ articles });
    }),
  );

  router.get(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const article = await getArticle(getRouteId(request));

      response.json({ article });
    }),
  );

  return router;
};
