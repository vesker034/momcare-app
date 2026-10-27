import { Express } from 'express';

import { createArticlesRouter } from './articles.controller';

export const registerArticlesModule = (app: Express): void => {
  app.use('/articles', createArticlesRouter());
};
