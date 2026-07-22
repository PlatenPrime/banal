import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { validate } from '../config/env.validation';
import { createIsolatedMongoUri, isMongoReachable } from '../../test/helpers/mongo-test-uri';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  let mongoAvailable = false;
  let mongoUri = '';

  beforeAll(async () => {
    mongoUri = createIsolatedMongoUri();
    mongoAvailable = await isMongoReachable(mongoUri);
  });

  it('registers Mongoose with MONGODB_URI from ConfigService', async () => {
    if (!mongoAvailable) {
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate,
          load: [
            () => ({
              NODE_ENV: 'test',
              PORT: '4000',
              MONGODB_URI: mongoUri,
              WEB_ORIGIN: 'http://localhost:3000',
              JWT_ACCESS_SECRET: 'ci-dummy-access-secret-min-32-chars!!',
              JWT_REFRESH_SECRET: 'ci-dummy-refresh-secret-min-32-chars!',
            }),
          ],
        }),
        DatabaseModule,
      ],
    }).compile();

    const connection = moduleRef.get(getConnectionToken());
    const dbName = mongoUri.match(/\/([^/?]+)(\?|$)/)?.[1];

    expect(connection).toBeDefined();
    expect(connection.name).toBe(dbName);

    await moduleRef.close();
  });
});
