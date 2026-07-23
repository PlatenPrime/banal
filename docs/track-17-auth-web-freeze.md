# Track 17 — Auth Web freeze checklist

Closes **T17** (steps **156–168**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                  | Status | Evidence                                                                             |
| ---- | ---------------------- | ------ | ------------------------------------------------------------------------------------ |
| 156  | Fetch credentials      | done   | `createApiClient` + legacy `request` use `credentials: 'include'`                    |
| 157  | Auth API module        | done   | `apps/web/src/lib/api-client/auth.ts` — login/logout/refresh/me + Zod                |
| 158  | `/login` route         | done   | `routes/login.tsx` + `LoginPage` TanStack Form (username + password)                 |
| 159  | Login mutation         | done   | sets query cache from login; redirects via `search.redirect`; Problem Details errors |
| 160  | `/logout` route/action | done   | `routes/logout.tsx` — logout API + clear auth queries → `/`                          |
| 161  | `requireAuth` helper   | done   | `lib/auth/require-auth.ts` — client `beforeLoad` → `/login`                          |
| 162  | Protect write routes   | done   | `/examples/new` wires `requireAuth`                                                  |
| 163  | Root `/auth/me`        | done   | `useAuth` + `authMeQueryOptions` (client-only; SSR anonymous)                        |
| 164  | 401 handling           | done   | `maybeRedirectOnUnauthorized` — skip `/login` and auth probe endpoints               |
| 165  | 429 handling           | done   | Login page shows rate-limit detail + `data-rate-limited`                             |
| 166  | Nav auth UI            | done   | `AppNav` — Log in / username + Log out                                               |
| 167  | LOCAL_SETUP auth       | done   | bootstrap admin + `/login` path in [`LOCAL_SETUP.md`](LOCAL_SETUP.md)                |
| 168  | T17 checklist          | done   | this file                                                                            |

## Verification

```bash
npx nx run web:test
npx nx run web:build
```

## Related

- Previous: [`track-16-auth-security-freeze.md`](track-16-auth-security-freeze.md)
- Next track: **T18 — Feature Flags Skeleton** (169–174)
- ADRs: [`adr/002-auth-jwt-cookies.md`](adr/002-auth-jwt-cookies.md), [`adr/003-app-users-collection.md`](adr/003-app-users-collection.md)
