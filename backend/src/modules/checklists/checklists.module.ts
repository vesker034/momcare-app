import { Express } from 'express';

import { createChecklistsRouter } from './checklists.controller';

export const registerChecklistsModule = (app: Express): void => {
  app.use('/checklists', createChecklistsRouter());
};
