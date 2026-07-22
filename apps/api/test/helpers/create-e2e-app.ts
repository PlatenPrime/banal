import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { applyApiUriVersioning } from '../../src/config/api-versioning';

export async function createE2eApp(env: Record<string, string>): Promise<{
  app: INestApplication;
  baseUrl: string;
  close: () => Promise<void>;
}> {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  applyApiUriVersioning(app);
  await app.init();
  await app.listen(0);

  return {
    app,
    baseUrl: await app.getUrl(),
    close: () => app.close(),
  };
}
