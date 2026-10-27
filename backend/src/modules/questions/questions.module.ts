import { Express } from 'express';

import { createQuestionsRouter } from './questions.controller';

export const registerQuestionsModule = (app: Express): void => {
  app.use('/doctor-questions', createQuestionsRouter());
};
