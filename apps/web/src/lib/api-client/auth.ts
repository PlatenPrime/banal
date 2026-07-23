import {
  authUserSchema,
  loginRequestSchema,
  type AuthUser,
  type LoginRequest,
} from '@app/shared-contracts';
import { getApiClient, unwrapApiResult, unwrapEmptyApiResult } from './create-api-client';

export async function login(body: LoginRequest): Promise<AuthUser> {
  const payload = loginRequestSchema.parse(body);
  const data = await unwrapApiResult(
    await getApiClient().POST('/api/v1/auth/login', { body: payload }),
  );
  return authUserSchema.parse(data);
}

export async function logout(): Promise<void> {
  await unwrapEmptyApiResult(await getApiClient().POST('/api/v1/auth/logout'));
}

export async function refreshSession(): Promise<AuthUser> {
  const data = await unwrapApiResult(await getApiClient().POST('/api/v1/auth/refresh'));
  return authUserSchema.parse(data);
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await unwrapApiResult(await getApiClient().GET('/api/v1/auth/me'));
  return authUserSchema.parse(data);
}
