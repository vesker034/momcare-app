import { Express } from 'express';

import { createPregnancyWeeksRouter } from './pregnancy-weeks.controller';

export const registerPregnancyWeeksModule = (app: Express): void => {
  app.use('/pregnancy-weeks', createPregnancyWeeksRouter());
};
