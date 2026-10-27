import type { Article, ArticleCategory } from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';

export interface ArticleListItemResponse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: ArticleCategory;
  pregnancyWeek: number | null;
  readingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleResponse extends ArticleListItemResponse {
  content: string;
}

export interface ArticleFilters {
  category?: ArticleCategory;
  pregnancyWeek?: number;
}

const articleCategoryOptions: readonly ArticleCategory[] = [
  'PREGNANCY',
  'NUTRITION',
  'ACTIVITY',
  'CHECKLISTS',
  'DOCTOR',
];
const articleCategoryValues = new Set<string>(articleCategoryOptions);

export const parseArticleCategory = (value: unknown): ArticleCategory | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'category must be a string');
  }

  const normalizedCategory = value.trim().toUpperCase();

  if (!articleCategoryValues.has(normalizedCategory)) {
    throw new HttpError(400, `category must be one of: ${articleCategoryOptions.join(', ')}`);
  }

  return normalizedCategory as ArticleCategory;
};

export const parsePregnancyWeek = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'pregnancyWeek must be a string query parameter');
  }

  const week = Number(value);

  if (!Number.isInteger(week) || week < 1 || week > 42) {
    throw new HttpError(400, 'pregnancyWeek must be an integer from 1 to 42');
  }

  return week;
};

const toListItemResponse = (article: Article): ArticleListItemResponse => {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    category: article.category,
    pregnancyWeek: article.pregnancyWeek,
    readingTimeMinutes: article.readingTimeMinutes,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
};

const toResponse = (article: Article): ArticleResponse => {
  return {
    ...toListItemResponse(article),
    content: article.content,
  };
};

export const getArticles = async (
  filters: ArticleFilters,
): Promise<ArticleListItemResponse[]> => {
  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.pregnancyWeek
        ? {
            OR: [
              { pregnancyWeek: filters.pregnancyWeek },
              { pregnancyWeek: null },
            ],
          }
        : {}),
    },
    orderBy: [
      { pregnancyWeek: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return articles.map(toListItemResponse);
};

export const getArticle = async (id: string): Promise<ArticleResponse> => {
  const article = await prisma.article.findFirst({
    where: {
      id,
      isPublished: true,
    },
  });

  if (!article) {
    throw new HttpError(404, 'Article was not found');
  }

  return toResponse(article);
};
