import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>banal</h1>
      <p>TanStack Start scaffold</p>
    </main>
  );
}
