import { Express } from 'express';

import { createVisitsRouter } from './visits.controller';

export const registerVisitsModule = (app: Express): void => {
  app.use('/visits', createVisitsRouter());
};
