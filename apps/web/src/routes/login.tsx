import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '../components/login-page';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect: redirectTo } = Route.useSearch();
  return <LoginPage redirectTo={safeRedirect(redirectTo)} />;
}

function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}
