import { Express } from 'express';

import { createPregnancyProfileRouter } from './pregnancy-profile.controller';

export const registerPregnancyProfileModule = (app: Express): void => {
  app.use('/pregnancy-profile', createPregnancyProfileRouter());
};
