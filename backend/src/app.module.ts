import cors from 'cors';
import express, { Express } from 'express';

import { registerArticlesModule } from './modules/articles/articles.module';
import { registerAuthModule } from './modules/auth/auth.module';
import { registerChecklistsModule } from './modules/checklists/checklists.module';
import { registerDiaryModule } from './modules/diary/diary.module';
import { registerPregnancyProfileModule } from './modules/pregnancy-profile/pregnancy-profile.module';
import { registerPregnancyWeeksModule } from './modules/pregnancy-weeks/pregnancy-weeks.module';
import { registerQuestionsModule } from './modules/questions/questions.module';
import { registerUsersModule } from './modules/users/users.module';
import { registerVisitsModule } from './modules/visits/visits.module';
import { errorHandler } from './shared/http/error-handler';

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  registerAuthModule(app);
  registerUsersModule(app);
  registerPregnancyProfileModule(app);
  registerPregnancyWeeksModule(app);
  registerDiaryModule(app);
  registerVisitsModule(app);
  registerQuestionsModule(app);
  registerChecklistsModule(app);
  registerArticlesModule(app);

  app.use(errorHandler);

  return app;
};
