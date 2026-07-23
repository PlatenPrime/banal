import { createFileRoute } from '@tanstack/react-router';
import { LogoutPage } from '../components/logout-page';

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
});
