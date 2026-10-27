import { createApp } from './app.module';
import { getEnvNumber } from './config/env';

const bootstrap = (): void => {
  const app = createApp();
  const port = getEnvNumber('PORT', 3000);

  app.listen(port, () => {
    console.log(`MomCare backend is running on port ${port}`);
  });
};

bootstrap();
