import { createFileRoute } from '@tanstack/react-router';
import { SHARED_CONTRACTS_READY } from '@app/shared-contracts';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>banal</h1>
      <p>TanStack Start scaffold</p>
      <p data-contracts={String(SHARED_CONTRACTS_READY)}>contracts wired</p>
    </main>
  );
}
