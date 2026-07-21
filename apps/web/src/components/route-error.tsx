import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { ApiClientError } from '../lib/api-client/client';

export function RouteError({ error, reset }: ErrorComponentProps) {
  const isApiError = error instanceof ApiClientError;
  const title = isApiError ? error.problem.title : 'Something went wrong';
  const status = isApiError ? error.problem.status : undefined;
  const detail = isApiError ? error.problem.detail : undefined;
  const fieldErrors = isApiError ? error.problem.errors : undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Error</h1>
      <div className="mt-4 space-y-2" role="alert">
        {status !== undefined ? (
          <p className="text-sm font-medium text-zinc-500">Status {status}</p>
        ) : null}
        <p className="text-zinc-900">{title}</p>
        {detail ? <p className="text-sm text-zinc-600">{detail}</p> : null}
        {fieldErrors ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
            {Object.entries(fieldErrors).map(([field, messages]) => (
              <li key={field}>
                {field}: {messages.join(', ')}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <nav className="mt-8 flex flex-wrap items-center gap-4" aria-label="Error actions">
        <button
          type="button"
          className="text-sky-700 underline-offset-4 hover:underline"
          onClick={reset}
        >
          Try again
        </button>
        <Link className="text-sky-700 underline-offset-4 hover:underline" to="/">
          Home
        </Link>
      </nav>
    </main>
  );
}

export function RouteNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-4 text-zinc-600" role="alert">
        This page does not exist.
      </p>
      <nav className="mt-8" aria-label="Not found">
        <Link className="text-sky-700 underline-offset-4 hover:underline" to="/">
          Home
        </Link>
      </nav>
    </main>
  );
}
