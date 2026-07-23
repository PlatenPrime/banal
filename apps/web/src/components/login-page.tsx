import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { login } from '../lib/api-client/auth';
import { authKeys } from '../lib/api-client/query-keys';
import { ApiClientError } from '../lib/api-client/client';
import { AppNav } from './app-nav';

type LoginPageProps = {
  redirectTo?: string;
};

export function LoginPage({ redirectTo = '/' }: LoginPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (user) => {
      queryClient.setQueryData(authKeys.me(), user);
      const target = redirectTo.startsWith('/') ? redirectTo : '/';
      await navigate({ href: target });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        if (error.status === 429 || error.problem.type === ERROR_TYPE_URIS.rateLimited) {
          setIsRateLimited(true);
          setSubmitError(
            error.problem.detail ?? 'Too many login attempts. Please try again later.',
          );
          return;
        }

        setIsRateLimited(false);
        setSubmitError(error.problem.detail ?? error.message);
        return;
      }

      setIsRateLimited(false);
      setSubmitError(error instanceof Error ? error.message : 'Login failed');
    },
  });

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    onSubmit: ({ value }) => {
      setSubmitError(null);
      setIsRateLimited(false);
      mutation.mutate({
        username: value.username,
        password: value.password,
      });
    },
  });

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <AppNav />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign in with your platform username and password.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="username"
          validators={{
            onBlur: ({ value }) =>
              value.trim().length < 3 ? 'Username must be at least 3 characters' : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block text-sm font-medium" htmlFor={field.name}>
                Username
              </label>
              <input
                id={field.name}
                name={field.name}
                autoComplete="username"
                className="mt-1 w-full border border-zinc-300 px-3 py-2"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                minLength={3}
              />
              {field.state.meta.errors.length > 0 ? (
                <p role="alert" className="mt-1 text-sm text-red-700">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onBlur: ({ value }) =>
              value.length < 8 ? 'Password must be at least 8 characters' : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block text-sm font-medium" htmlFor={field.name}>
                Password
              </label>
              <input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full border border-zinc-300 px-3 py-2"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                minLength={8}
              />
              {field.state.meta.errors.length > 0 ? (
                <p role="alert" className="mt-1 text-sm text-red-700">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        {submitError ? (
          <p
            role="alert"
            data-rate-limited={isRateLimited ? 'true' : undefined}
            className="text-sm text-red-700"
          >
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          className="bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm">
        <Link className="text-sky-700 underline-offset-4 hover:underline" to="/">
          Back home
        </Link>
      </p>
    </main>
  );
}
