import { Link } from '@tanstack/react-router';
import { SHARED_CONTRACTS_READY } from '@app/shared-contracts';

export function HomePage() {
  return (
    <main>
      <h1>banal</h1>
      <p>TanStack Start scaffold</p>
      <p data-contracts={String(SHARED_CONTRACTS_READY)}>contracts wired</p>
      <nav aria-label="Main">
        <ul>
          <li>
            <Link to="/examples">Examples</Link>
          </li>
          <li>
            <Link to="/examples/new">New example</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
