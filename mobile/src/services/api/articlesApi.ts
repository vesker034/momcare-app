import type {
  ArticleCategory,
  ArticleResponse,
  ArticlesResponse,
} from '../../types/api';
import { apiRequest } from './apiClient';

export function getArticles() {
  return apiRequest<ArticlesResponse>('/articles');
}

export function getArticleById(id: string) {
  return apiRequest<ArticleResponse>(`/articles/${id}`);
}

export function getArticlesByWeek(week: number) {
  return apiRequest<ArticlesResponse>(`/articles?pregnancyWeek=${week}`);
}

export function getArticlesByCategory(category: ArticleCategory) {
  return apiRequest<ArticlesResponse>(`/articles?category=${category}`);
}
