import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { examplesQueryOptions } from '../lib/api-client/examples-query';
import { RouteError } from './route-error';

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

export function ExamplesError(props: ErrorComponentProps) {
  return <RouteError {...props} />;
}
