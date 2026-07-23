import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { logout } from '../lib/api-client/auth';
import { authKeys } from '../lib/api-client/query-keys';
import { AppNav } from './app-nav';

export function LogoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    void (async () => {
      try {
        await logout();
      } catch {
        setErrorMessage('Logout request failed; session cleared locally.');
      } finally {
        queryClient.removeQueries({ queryKey: authKeys.all });
        await navigate({ to: '/' });
      }
    })();
  }, [navigate, queryClient]);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <AppNav />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Signing out…</h1>
      <p className="mt-2 text-sm text-zinc-600">Clearing your session and returning home.</p>
      {errorMessage ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {errorMessage}{' '}
          <Link className="text-sky-700 underline-offset-4 hover:underline" to="/">
            Continue home
          </Link>
        </p>
      ) : null}
    </main>
  );
}
