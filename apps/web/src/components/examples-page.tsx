import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { ApiClientError } from '../lib/api-client/client';
import { examplesQueryOptions } from '../lib/api-client/examples-query';

export function ExamplesPage() {
  const { data } = useSuspenseQuery(examplesQueryOptions);

  return (
    <main>
      <h1>Examples</h1>
      <p>{data.total} total</p>
      {data.items.length === 0 ? (
        <p>No examples yet.</p>
      ) : (
        <ul>
          {data.items.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              {item.description ? <span> — {item.description}</span> : null}
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Examples">
        <Link to="/examples/new">Create example</Link>
        {' · '}
        <Link to="/">Home</Link>
      </nav>
    </main>
  );
}

export function ExamplesError({ error }: ErrorComponentProps) {
  const message = error instanceof ApiClientError ? error.problem.title : 'Failed to load examples';

  return (
    <main>
      <h1>Examples</h1>
      <p role="alert">{message}</p>
      <Link to="/">Home</Link>
    </main>
  );
}
