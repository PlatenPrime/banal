import { createFileRoute } from '@tanstack/react-router';
import { ExamplesError, ExamplesPage } from '../../components/examples-page';
import { examplesQueryOptions } from '../../lib/api-client/examples-query';
import type { RouterContext } from '../../router-context';

export const Route = createFileRoute('/examples/')({
  loader: ({ context }) =>
    (context as RouterContext).queryClient.ensureQueryData(examplesQueryOptions),
  errorComponent: ExamplesError,
  component: ExamplesPage,
});
