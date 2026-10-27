import { Express } from 'express';

import { createDiaryRouter } from './diary.controller';

export const registerDiaryModule = (app: Express): void => {
  app.use('/diary', createDiaryRouter());
};
