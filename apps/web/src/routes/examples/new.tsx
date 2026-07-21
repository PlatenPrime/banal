import { createFileRoute } from '@tanstack/react-router';
import { NewExamplePage } from '../../components/new-example-page';

export const Route = createFileRoute('/examples/new')({
  component: NewExamplePage,
});
