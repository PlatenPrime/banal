import { Link } from '@tanstack/react-router';
import { useAuth } from '../lib/auth/use-auth';

export function AppNav() {
  const { data: user, isPending, isError } = useAuth();
  const isAuthenticated = Boolean(user) && !isError;

  return (
    <nav aria-label="Account" className="flex flex-wrap items-center gap-3 text-sm">
      {isPending ? (
        <span className="text-zinc-500">Checking session…</span>
      ) : isAuthenticated && user ? (
        <>
          <span data-testid="nav-username" className="text-zinc-700">
            {user.username}
          </span>
          <Link className="text-sky-700 underline-offset-4 hover:underline" to="/logout">
            Log out
          </Link>
        </>
      ) : (
        <Link className="text-sky-700 underline-offset-4 hover:underline" to="/login">
          Log in
        </Link>
      )}
    </nav>
  );
}
