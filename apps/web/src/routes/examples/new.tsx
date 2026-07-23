import { createFileRoute } from '@tanstack/react-router';
import { NewExamplePage } from '../../components/new-example-page';
import { requireAuth } from '../../lib/auth/require-auth';

export const Route = createFileRoute('/examples/new')({
  beforeLoad: requireAuth,
  component: NewExamplePage,
});
