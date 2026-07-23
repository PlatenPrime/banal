import { Link } from '@tanstack/react-router';
import { SHARED_CONTRACTS_READY } from '@app/shared-contracts';
import { AppNav } from './app-nav';

export function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">banal</h1>
          <p className="mt-2 text-zinc-600">TanStack Start scaffold</p>
          <p className="mt-1 text-sm text-zinc-500" data-contracts={String(SHARED_CONTRACTS_READY)}>
            contracts wired
          </p>
        </div>
        <AppNav />
      </div>
      <nav className="mt-8" aria-label="Main">
        <ul className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <li>
            <Link className="text-sky-700 underline-offset-4 hover:underline" to="/examples">
              Examples
            </Link>
          </li>
          <li>
            <Link className="text-sky-700 underline-offset-4 hover:underline" to="/examples/new">
              New example
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
