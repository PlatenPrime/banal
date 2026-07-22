import { randomUUID } from 'node:crypto';

const DEFAULT_MONGO_HOST = 'mongodb://127.0.0.1:27017';

/** Builds a unique database URI per test run for parallel-safe e2e. */
export function createIsolatedMongoUri(
  baseUri = process.env.MONGODB_URI ?? DEFAULT_MONGO_HOST,
): string {
  const dbName = `vitest_${randomUUID().replace(/-/g, '')}`;
  const match = baseUri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/([^?]*))?(\?.*)?$/);

  if (!match) {
    throw new Error(`Invalid MONGODB_URI: ${baseUri}`);
  }

  const [, host, , query = ''] = match;
  return `${host}/${dbName}${query}`;
}

export function createE2eEnv(mongoUri: string) {
  return {
    NODE_ENV: 'test',
    PORT: '4000',
    MONGODB_URI: mongoUri,
    WEB_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: 'ci-dummy-access-secret-min-32-chars!!',
    JWT_REFRESH_SECRET: 'ci-dummy-refresh-secret-min-32-chars!',
  } as const;
}

export async function isMongoReachable(uri: string): Promise<boolean> {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 2_000,
    connectTimeoutMS: 2_000,
  });

  try {
    await client.connect();
    await client.db().admin().ping();
    return true;
  } catch {
    return false;
  } finally {
    await client.close().catch(() => undefined);
  }
}
