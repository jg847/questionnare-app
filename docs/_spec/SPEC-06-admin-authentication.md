# Spec: Admin Authentication

**ID:** SPEC-06  
**Status:** Draft  
**Sprint:** 4

## Summary

This spec defines the MVP authentication flow for the ToolMatch AI admin surface. It covers a single-password login backed by `ADMIN_SECRET`, protected `/admin/*` routes, session persistence, logout behavior, and the minimum analytics and security expectations needed for a simple two-week build.

## User Stories

- As an admin, I want to log in with a single password so that I can manage the offer catalog without direct database access.
- As an admin, I want my session to persist while I work so that I do not need to re-authenticate on every page.
- As a developer, I want the admin auth flow to stay simple and deterministic so that it is quick to implement and easy to reason about.

## MVP Scope

### Must Exist for MVP

- A dedicated admin login page
- Authentication using a single shared `ADMIN_SECRET`
- Protection for `/admin/*` routes
- Session persistence after successful login
- A logout flow that clears the admin session
- Emission of the `admin_login_succeeded` analytics event on successful login

### Can Be Stubbed or Deferred

- Multi-user admin accounts
- Role-based permissions or scoped access
- Password reset, email verification, or magic link flows
- Supabase Auth integration
- Audit history beyond the minimum analytics event taxonomy
- Brute-force protection beyond a simple MVP-safe baseline

### Assumptions

- Only one shared admin credential is required for MVP.
- `ADMIN_SECRET` is provided through environment configuration and is required in all non-test environments.
- The admin surface will primarily support offer management during MVP.
- A secure cookie-based session is sufficient for MVP and does not require a backing user table.
- The login route should remain publicly reachable and must not be trapped behind the general `/admin/*` guard.

## Functional Requirements

1. Implement a login page for the admin surface.
2. The login page must live at a public route such as `/login` or `/admin-login`, or be explicitly excluded from any `/admin/*` protection logic.
3. Authenticate admin access using a single password compared against `ADMIN_SECRET`.
4. Do not use Supabase Auth or a public user account system for the MVP admin flow.
5. Create a server-validated admin session on successful login.
6. Persist the admin session across requests until logout, expiration, or invalidation.
7. For MVP, the admin session must expire after 24 hours of inactivity.
8. Protect all `/admin/*` pages from unauthenticated access.
9. Protect admin-only API routes used by the admin interface from unauthenticated access.
10. Redirect unauthenticated admin page requests to the login page.
11. Return an appropriate unauthorized response for unauthenticated admin API requests.
12. If `ADMIN_SECRET` is missing or empty in a non-test environment, the auth system must fail closed: login must not succeed, protected admin routes must remain unavailable, and the application must surface a clear server-side configuration error for developers.
13. Provide a logout flow that clears the admin session and returns the admin to the login page.
14. Emit the `admin_login_succeeded` analytics event when authentication succeeds.
15. Failed login attempts must not expose whether the password was close, partially correct, or otherwise leak validation details.
16. The authentication flow must remain compatible with the admin routes required for SPEC-07.

## Non-Functional Requirements

- Keep the auth flow simple enough for MVP implementation in Sprint 3.
- Prefer server-managed session validation over client-only trust.
- Avoid exposing secrets or implementation details in the browser.
- Use secure cookie settings appropriate for the deployment environment.
- Use a session lifetime short enough to limit stale admin access while remaining practical for MVP admin work.
- Keep unauthorized states explicit and non-technical for the admin user.
- Misconfiguration should fail safely rather than silently weakening admin protection.

## Data Model

No new database tables are required for MVP authentication.

This spec depends on:

- the `ADMIN_SECRET` environment variable defined in [brief.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/brief.md)
- the analytics event taxonomy in [brief.md](c:/Users/jeanp/NJIT/IS322/questionnare-app/brief.md)

An implementation may use a signed cookie or equivalent server-managed session token without introducing a persisted admin user model.

## API Contract

Suggested auth endpoints:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- optional session-check endpoint only if it keeps implementation simple

Suggested login page route:

- `/login` or `/admin-login`, or another route explicitly excluded from the `/admin/*` protection rule

Suggested request shape for login:

```ts
type AdminLoginRequest = {
  password: string;
};
```

Suggested response shape for login:

```ts
type AdminLoginResponse = {
  authenticated: boolean;
};
```

Suggested response shape for logout:

```ts
type AdminLogoutResponse = {
  loggedOut: boolean;
};
```

Behavior requirements:

- successful login creates the admin session server-side and returns `authenticated: true`
- failed login returns `authenticated: false` with a generic invalid-credentials message
- missing `ADMIN_SECRET` in a non-test environment prevents successful authentication and should surface a server-side configuration failure
- logout clears the admin session regardless of current page location

## UI/UX Notes

- The login page should feel functional and minimal, not like a public marketing screen.
- The password form should expose a clear success or failure state without revealing sensitive details.
- After login, the admin should land on a sensible protected entry point such as the dashboard or offers page.
- Logout should be clearly accessible from the admin interface.
- Unauthorized redirects should feel intentional rather than broken.
- The login route must remain reachable when the rest of the admin surface is protected.

## Design Patterns

- **Single Responsibility:** login handling, session creation, route guarding, and logout should be separated into focused modules.
- **Dependency Inversion:** admin page code should depend on an auth abstraction or guard utility rather than embedding direct cookie logic everywhere.
- **Observer:** successful login can emit analytics without coupling the auth decision directly to analytics internals.
- **Decorator:** route handlers can be wrapped by a lightweight auth guard for protected admin APIs.

## Test Cases

### Unit Tests

- Positive: a correct password produces an authenticated result.
- Negative: an incorrect password returns a generic authentication failure.
- Negative: missing or empty password input is rejected safely.
- Negative: missing `ADMIN_SECRET` in a non-test environment causes authentication to fail closed.
- Edge: logout clears the session state even if called from a partially initialized admin page.

### Integration Tests

- Positive: a successful login creates a valid admin session cookie.
- Positive: authenticated requests can access protected admin pages or APIs.
- Positive: a successful login emits the `admin_login_succeeded` analytics event.
- Positive: an admin session expires after the documented inactivity window.
- Negative: unauthenticated requests to `/admin/*` are redirected to the login page.
- Negative: unauthenticated requests to protected admin APIs receive an unauthorized response.
- Negative: the login route remains reachable without authentication and does not redirect-loop under admin route protection.
- Edge: logout invalidates a previously valid admin session and blocks subsequent protected access.

### E2E Tests

- Positive: an admin can log in and reach the protected admin surface.
- Positive: an admin session persists during navigation between protected admin pages.
- Negative: an invalid password does not grant access.
- Negative: a missing `ADMIN_SECRET` configuration does not allow admin access.
- Edge: logout returns the admin to the login page and prevents returning to protected pages without re-authentication.

## Acceptance Criteria

- [ ] A dedicated admin login page exists.
- [ ] The admin login page is publicly reachable and does not get trapped behind `/admin/*` protection.
- [ ] Admin login uses `ADMIN_SECRET` as the single password source for MVP.
- [ ] Supabase Auth is not required for the MVP admin flow.
- [ ] Successful login creates a persistent admin session.
- [ ] Admin sessions expire after 24 hours of inactivity.
- [ ] Unauthenticated `/admin/*` page requests are redirected to the login page.
- [ ] Unauthenticated admin API requests are denied with an unauthorized response.
- [ ] Missing `ADMIN_SECRET` in a non-test environment fails closed and does not allow admin access.
- [ ] Logout clears the admin session and returns the user to the login page.
- [ ] Successful login emits the `admin_login_succeeded` analytics event.
- [ ] Failed login responses do not leak sensitive authentication details.
- [ ] The auth flow is compatible with the admin routes needed for SPEC-07.
- [ ] Unit, integration, and E2E tests cover the success path, failure path, and logout path.

## Sprint Tasks

1. Define the admin login route, request contract, and session strategy.
2. Choose a public login route that avoids `/admin/*` guard loops.
3. Implement `POST /api/admin/login` against `ADMIN_SECRET`.
4. Add fail-closed handling for missing `ADMIN_SECRET` in non-test environments.
5. Create the admin session mechanism using a secure server-managed cookie or equivalent, with a 24-hour inactivity timeout.
6. Protect `/admin/*` routes and admin-only APIs with a shared auth guard.
7. Implement logout and session invalidation.
8. Emit `admin_login_succeeded` after successful authentication.
9. Add the admin login UI and logout affordance.
10. Add unit, integration, and E2E coverage for login, protected access, logout, configuration failure behavior, and session expiration.
