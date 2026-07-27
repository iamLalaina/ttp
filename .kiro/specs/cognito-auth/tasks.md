# Implementation Tasks — AWS Cognito Authentication

## References
- #[[file:.kiro/specs/cognito-auth/requirements.md]]
- #[[file:.kiro/specs/cognito-auth/design.md]]

---

## Task Order Rationale

Infrastructure first (packages, JWT verification), then API routes, then UI, then integration/migration.
The core verification logic must work before any UI or middleware changes.

---

## Tasks

- [x] **Task 1 — Install packages**
  - Install `jose` (JWT verification — edge-compatible).
  - Install `amazon-cognito-identity-js` (Cognito SDK for server-side auth flows).
  - Verify both resolve correctly.

- [x] **Task 2 — Zod auth schemas**
  - Create `schemas/auth.schema.ts` with:
    - `loginSchema` — email (email format), password (min 8)
    - `registerSchema` — email, password (min 8, pattern: 1 upper, 1 lower, 1 number), confirmPassword (must match)
    - `verifySchema` — email, code (6 chars)
    - `refreshSchema` — (empty or token field, depending on approach)
  - Use Zod 4 API.

- [x] **Task 3 — Rewrite lib/cognito.ts**
  - Replace the entire file with production JWT verification using `jose`.
  - Implement `verifyIdToken(token: string): Promise<{ id: string } | null>`:
    - Uses `createRemoteJWKSet` with the Cognito JWKS URL.
    - Validates issuer, audience, token_use, and expiry.
    - Returns `{ id: payload.sub }` on success, `null` on failure.
  - Implement `getCurrentUser(req: NextRequest): Promise<{ id: string } | null>`:
    - Reads `id-token` cookie (fallback to Authorization header).
    - Calls `verifyIdToken`.
  - Implement `getCurrentUserFromCookies(): Promise<{ id: string } | null>`:
    - Reads `id-token` cookie via `next/headers`.
    - Calls `verifyIdToken`.
  - Remove all stub code and `console.warn` messages.

- [x] **Task 4 — API: POST /api/auth/register**
  - Create `app/api/auth/register/route.ts`.
  - Validates body with `registerSchema`.
  - Calls Cognito `signUp` via `amazon-cognito-identity-js`.
  - Returns 201 on success, 400 on validation/Cognito errors.
  - Handles: UsernameExistsException, InvalidPasswordException.

- [x] **Task 5 — API: POST /api/auth/verify**
  - Create `app/api/auth/verify/route.ts`.
  - Validates body with `verifySchema`.
  - Calls Cognito `confirmRegistration`.
  - Returns 200 on success, 400 on invalid/expired code.

- [x] **Task 6 — API: POST /api/auth/login**
  - Create `app/api/auth/login/route.ts`.
  - Validates body with `loginSchema`.
  - Calls Cognito `authenticateUser` (SRP flow).
  - On success: sets httpOnly cookies (id-token, access-token, refresh-token).
  - Returns 200 with `{ success: true }`.
  - Handles: UserNotFoundException, NotAuthorizedException, UserNotConfirmedException.

- [x] **Task 7 — API: POST /api/auth/refresh**
  - Create `app/api/auth/refresh/route.ts`.
  - Reads `refresh-token` cookie.
  - Calls Cognito `refreshSession`.
  - Sets updated id-token and access-token cookies.
  - Returns 200 on success, 401 if refresh fails.

- [x] **Task 8 — API: POST /api/auth/logout**
  - Create `app/api/auth/logout/route.ts`.
  - Clears all auth cookies (id-token, access-token, refresh-token) by setting Max-Age=0.
  - Returns 200.

- [x] **Task 9 — Update middleware.ts**
  - Replace presence check with JWT signature verification using `jose`.
  - Read `id-token` cookie.
  - If missing or verification fails → redirect to `/login?callbackUrl=...`.
  - If valid → `NextResponse.next()`.
  - Keep the existing matcher config (exclude /api, /_next, /login, /register, /catalog, static files).
  - Add `/rescuers` to the exclusion list (public route).

- [x] **Task 10 — LoginForm component**
  - Create `components/auth/LoginForm.tsx` as Client Component.
  - Fields: email, password.
  - Submits to `POST /api/auth/login`.
  - On success: redirect to callbackUrl or /dashboard.
  - Handles errors: shows Cognito error messages.

- [x] **Task 11 — RegisterForm component**
  - Create `components/auth/RegisterForm.tsx` as Client Component.
  - Fields: email, password, confirm password.
  - Submits to `POST /api/auth/register`.
  - On success: switches to verification code form.
  - Handles errors: user exists, weak password.

- [x] **Task 12 — VerifyForm component**
  - Create `components/auth/VerifyForm.tsx` as Client Component.
  - Fields: email (pre-filled), 6-digit code.
  - Submits to `POST /api/auth/verify`.
  - On success: redirects to /login with "Account verified" message.

- [x] **Task 13 — LogoutButton component**
  - Create `components/auth/LogoutButton.tsx` as Client Component.
  - Calls `POST /api/auth/logout`.
  - Redirects to /login after success.

- [x] **Task 14 — Auth layout + pages**
  - Create `app/(auth)/layout.tsx` — minimal centered layout.
  - Replace `app/login/page.tsx` → move to `app/(auth)/login/page.tsx` with `<LoginForm>`.
  - Create `app/(auth)/register/page.tsx` with `<RegisterForm>`.
  - Delete the old `app/login/page.tsx` stub.

- [x] **Task 15 — Update main layout**
  - Add `<LogoutButton>` to the authenticated `app/(main)/layout.tsx` nav.

- [x] **Task 16 — Remove hardcoded stub tokens from Client Components**
  - Remove `Authorization: "Bearer stub-token"` from:
    - `PetForm.tsx`
    - `PetEditForm.tsx`
    - `PetPhotoUploader.tsx`
    - `RequestActions.tsx`
  - Since cookies are httpOnly and sent automatically with same-origin fetch requests, no Authorization header is needed. The API routes read from cookies.

- [x] **Task 17 — Update API routes to read from cookies**
  - Verify that `getCurrentUser(req)` in all existing API routes now reads `id-token` cookie correctly (it should — the rewrite in Task 3 handles this).
  - No code changes needed if Task 3 was done correctly — just verify.

- [x] **Task 18 — Update seed data**
  - Document in `prisma/seed.ts` that `ownerId` should be set to a real Cognito user's `sub` for local development.
  - Add a comment with instructions for obtaining the sub from Cognito.
  - Optionally: read `SEED_OWNER_ID` from env to make it configurable.

- [x] **Task 19 — Build verification**
  - Run `npx tsc --noEmit`.
  - Run `npm run build`.
  - Verify all auth routes appear in the build output.
  - Manual test:
    1. Register a new user → email received → verify code.
    2. Log in → cookies set → redirected to dashboard.
    3. Access protected route → works.
    4. Tamper with cookie → redirected to login.
    5. Logout → cookies cleared → redirected to login.
    6. Register a pet → ownerId matches Cognito sub.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] Registration creates a Cognito user.
- [ ] Email verification flow works.
- [ ] Login sets httpOnly cookies with real JWTs.
- [ ] Middleware verifies JWT signature (not just presence).
- [ ] getCurrentUser returns the real Cognito sub.
- [ ] getCurrentUserFromCookies returns the real Cognito sub.
- [ ] Protected routes redirect on invalid/expired tokens.
- [ ] Logout clears all cookies.
- [ ] No "stub-token" or "stub-user-id" references remain in production code.
- [ ] Client Components no longer send hardcoded Authorization headers.
- [ ] All existing features (pets, images, requests, profile) work with real auth.
- [ ] No TypeScript `any` types introduced.
- [ ] Build passes with zero errors.

