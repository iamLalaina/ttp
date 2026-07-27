# Technical Design — AWS Cognito Authentication

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]

---

## Architecture Overview

```
Client (Browser)
  └── Login/Register Forms (Client Components)
        └── POST /api/auth/login, /api/auth/register, /api/auth/verify, /api/auth/refresh, /api/auth/logout
              └── Cognito SDK (amazon-cognito-identity-js)
                    └── AWS Cognito User Pool

Middleware
  └── Reads id-token cookie → verifies JWT via JWKS → allows or redirects

Server Components / API Routes
  └── getCurrentUser(req) / getCurrentUserFromCookies()
        └── Verifies id-token JWT → returns { id: sub }
```

**Key principle:** All Cognito SDK operations happen server-side in API Route Handlers. The client never directly communicates with Cognito — it sends credentials to our API, which handles the Cognito flow and sets httpOnly cookies. This prevents token leakage via XSS.

---

## Package Selection

### JWT Verification: `jose`

The `jose` library is the recommended choice for JWT verification in Next.js edge/middleware:
- Works in Edge Runtime (used by middleware)
- No Node.js `crypto` dependency issues
- Supports JWKS remote key fetching and caching
- TypeScript-native

### Cognito SDK: `amazon-cognito-identity-js`

Used server-side in API routes for:
- User registration (signUp)
- Authentication (authenticateUser)
- Email verification (confirmRegistration)
- Token refresh (refreshSession)

This is a lightweight library that handles the SRP (Secure Remote Password) authentication protocol required by Cognito without needing the full Amplify SDK.

---

## Token Flow

```
1. Login:
   Client sends { email, password } → POST /api/auth/login
   API calls Cognito authenticateUser
   Cognito returns: idToken, accessToken, refreshToken
   API sets httpOnly cookies and returns { success: true }

2. Protected Request:
   Browser sends cookies automatically
   Middleware reads id-token cookie
   Middleware verifies JWT signature + claims via JWKS
   If valid → NextResponse.next()
   If invalid → redirect to /login

3. API Route:
   getCurrentUser(req) reads id-token from cookie/header
   Verifies JWT → extracts sub → returns { id: sub }

4. Refresh:
   When id-token expires, middleware/API detects expiry
   POST /api/auth/refresh uses refresh-token cookie
   Gets new id-token + access-token from Cognito
   Sets updated cookies
```

---

## Cookie Configuration

| Cookie | Value | httpOnly | Secure | SameSite | Max-Age |
|---|---|---|---|---|---|
| `id-token` | JWT string | Yes | Yes (prod) | Lax | 3600 (1h) |
| `access-token` | JWT string | Yes | Yes (prod) | Lax | 3600 (1h) |
| `refresh-token` | Opaque string | Yes | Yes (prod) | Lax | 2592000 (30d) |

In development (`NODE_ENV !== "production"`), `Secure` is set to `false` to allow HTTP.

---

## JWT Verification (JWKS)

The Cognito JWKS URL follows the pattern:
```
https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
```

Verification steps:
1. Fetch JWKS (cached — `jose` handles this with `createRemoteJWKSet`).
2. Verify JWT signature against the matching key.
3. Validate claims:
   - `iss` must equal `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`
   - `aud` (for id-token) must equal the Cognito App Client ID
   - `token_use` must be `"id"` (for id-token)
   - `exp` must be in the future

---

## User Identity — No Local User Table

**Decision:** For the MVP, Cognito is the sole user store. The `sub` claim from the ID token is used directly as `ownerId` in all existing models.

**Rationale:**
- Avoids syncing users between Cognito and a local table.
- The existing `ownerId` field is a plain `String` — it already accepts any string identifier.
- Profile data is handled by `RescuerProfile` (optional, already implemented).
- If a local User table is needed later (e.g., for admin roles), it can be added as a separate migration.

---

## lib/cognito.ts — Rewrite

The existing file is replaced (not duplicated) with production implementations:

```ts
// lib/cognito.ts

import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const JWKS_URL = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
const ISSUER = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`;
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID!;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

async function verifyIdToken(token: string): Promise<{ id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: CLIENT_ID,
    });
    if (payload.token_use !== "id") return null;
    return { id: payload.sub as string };
  } catch {
    return null;
  }
}

// For API Route Handlers (reads from cookie or Authorization header)
export async function getCurrentUser(req: NextRequest): Promise<{ id: string } | null> { ... }

// For Server Components (reads from cookies via next/headers)
export async function getCurrentUserFromCookies(): Promise<{ id: string } | null> { ... }
```

---

## API Routes

### `POST /api/auth/register`
- Body: `{ email, password }`
- Calls Cognito `signUp`
- Returns success or error (user exists, weak password, etc.)

### `POST /api/auth/verify`
- Body: `{ email, code }`
- Calls Cognito `confirmRegistration`
- Returns success or error (invalid code, expired, etc.)

### `POST /api/auth/login`
- Body: `{ email, password }`
- Calls Cognito `authenticateUser`
- Sets httpOnly cookies (id-token, access-token, refresh-token)
- Returns `{ success: true }` with user info

### `POST /api/auth/refresh`
- Reads refresh-token cookie
- Calls Cognito `refreshSession`
- Sets updated id-token and access-token cookies
- Returns `{ success: true }`

### `POST /api/auth/logout`
- Clears all auth cookies
- Returns `{ success: true }`

---

## Middleware Update

Replace presence check with JWT verification:

```ts
import { jwtVerify, createRemoteJWKSet } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("id-token")?.value;
  if (!token) return redirect("/login");

  try {
    await jwtVerify(token, jwks, { issuer: ISSUER, audience: CLIENT_ID });
    return NextResponse.next();
  } catch {
    // Token invalid or expired — try refresh or redirect
    return redirect("/login");
  }
}
```

---

## Component Structure

### `components/auth/LoginForm.tsx`
- Client Component
- Email + password fields
- Submits to `POST /api/auth/login`
- Handles callbackUrl redirect
- Shows Cognito errors

### `components/auth/RegisterForm.tsx`
- Client Component
- Email + password + confirm password fields
- Submits to `POST /api/auth/register`
- On success: shows verification code form

### `components/auth/VerifyForm.tsx`
- Client Component
- Email + 6-digit code
- Submits to `POST /api/auth/verify`
- On success: redirects to /login

### `components/auth/LogoutButton.tsx`
- Client Component
- Calls `POST /api/auth/logout`
- Clears state and redirects

---

## Pages

### `/login` — Login page
- `app/(auth)/login/page.tsx` — public, renders `<LoginForm>`

### `/register` — Registration page
- `app/(auth)/register/page.tsx` — public, renders `<RegisterForm>`

### Auth layout
- `app/(auth)/layout.tsx` — minimal layout without navigation (same as current public approach but simpler)

---

## Migration Strategy

### From stub to real auth:

1. **Install packages:** `jose`, `amazon-cognito-identity-js`
2. **Rewrite `lib/cognito.ts`:** Replace stubs with real JWT verification.
3. **Create API routes:** `/api/auth/*` for all auth flows.
4. **Replace login page:** Real form instead of fake cookie button.
5. **Add registration page:** New route.
6. **Update middleware:** JWT verification instead of presence check.
7. **Update cookie name:** `auth-token` → `id-token` (breaking change for existing sessions — acceptable since there are no real users yet).
8. **Remove hardcoded "Bearer stub-token":** Replace with real token from cookies in Client Components (via a helper that reads the token from the auth context or omits the header, relying on cookies).
9. **Reseed database:** Update seed data's `ownerId` to match a real Cognito user's `sub` for local development.

### Client Components currently hardcoding "Bearer stub-token":
- `PetForm.tsx`
- `PetEditForm.tsx`
- `PetPhotoUploader.tsx`
- `RequestActions.tsx`

These should be updated to either:
- Omit the Authorization header entirely (rely on cookies — httpOnly cookies are sent automatically), OR
- Read the token from an AuthContext provider.

**Recommended:** Omit the header and rely on cookies. Since cookies are httpOnly and sent automatically with same-origin requests, the API routes can read from cookies directly. This is the simplest migration path.

---

## File Map

```
lib/
  cognito.ts                            ← Rewrite: real JWT verification

middleware.ts                           ← Update: verify JWT signature

app/
  api/
    auth/
      register/route.ts                 ← POST — Cognito signUp
      verify/route.ts                   ← POST — confirmRegistration
      login/route.ts                    ← POST — authenticateUser + set cookies
      refresh/route.ts                  ← POST — refreshSession + update cookies
      logout/route.ts                   ← POST — clear cookies
  (auth)/
    layout.tsx                          ← Minimal auth layout
    login/page.tsx                      ← Replace existing placeholder
    register/page.tsx                   ← New

components/
  auth/
    LoginForm.tsx                       ← Client Component
    RegisterForm.tsx                    ← Client Component
    VerifyForm.tsx                      ← Client Component
    LogoutButton.tsx                    ← Client Component

schemas/
  auth.schema.ts                        ← Zod schemas for auth inputs

app/(main)/layout.tsx                   ← Add LogoutButton to nav
```

---

## Environment Variables Required

Already defined in `.env.example`:
```
AWS_REGION
AWS_COGNITO_USER_POOL_ID
AWS_COGNITO_CLIENT_ID
```

These are sufficient. No additional variables needed — Cognito does not require server-side secrets for the standard auth flow (SRP is client-authenticated via the user pool client ID).

---

## Security Considerations

- **httpOnly cookies prevent XSS token theft** — JavaScript cannot read the tokens.
- **SameSite=Lax prevents CSRF** — cookies not sent on cross-origin requests.
- **JWT verification in middleware** catches expired/tampered tokens before any page renders.
- **No client-side token storage** — no localStorage, no sessionStorage.
- **Refresh tokens are long-lived (30d)** but stored in httpOnly cookies — only the server can use them.
- **Cognito handles password hashing** — never stored locally.
