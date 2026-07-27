# Requirements — AWS Cognito Authentication

## Overview

This specification replaces the temporary stub authentication with a production-ready AWS Cognito integration. Users will register, log in, and manage sessions using Cognito as the sole identity provider. The Cognito `sub` (unique user ID) maps directly to the existing `ownerId` fields throughout the application.

**Out of scope:**
- Social login providers (Google, Facebook) — future enhancement
- Multi-factor authentication (MFA) — future enhancement
- Password reset email customization
- Admin user management panel
- Role-based access control (all authenticated users have equal permissions)

---

## Functional Requirements

### Registration

#### FR-01 — Registration Page
A public registration page must exist at `/register` where new users can create an account.

#### FR-02 — Registration Fields
The registration form must collect:
- **Email** — required, valid email format (used as the Cognito username)
- **Password** — required, minimum 8 characters, at least one uppercase, one lowercase, one number
- **Confirm password** — must match password

#### FR-03 — Email Verification
After registration, Cognito sends a verification code to the user's email. The app must provide a verification code input screen before the user can log in.

#### FR-04 — Registration Errors
Handle and display Cognito errors: email already exists, weak password, invalid email format.

### Login

#### FR-05 — Login Page
The existing `/login` route must be replaced with a real login form collecting email and password.

#### FR-06 — Login Success
On successful authentication, Cognito returns tokens (ID token, access token, refresh token). The tokens must be stored in httpOnly cookies (not localStorage) and the user redirected to the dashboard or the `callbackUrl` from the query string.

#### FR-07 — Login Errors
Handle and display Cognito errors: user not found, incorrect password, user not confirmed.

### Logout

#### FR-08 — Logout Action
A logout action must clear all auth cookies and redirect to the login page.

#### FR-09 — Logout Link
The authenticated layout must include a logout link/button in the navigation.

### Session Management

#### FR-10 — Token Storage
Auth tokens must be stored in httpOnly, secure, SameSite cookies. The ID token is used for user identification; the access token for API authorization.

#### FR-11 — Token Verification
All protected operations must verify the JWT token by:
1. Checking the signature against the Cognito JWKS (JSON Web Key Set) endpoint.
2. Validating the `exp` (expiry), `iss` (issuer), and `aud`/`client_id` claims.
3. Extracting `sub` as the user's unique identifier.

#### FR-12 — Token Refresh
When the access token expires (typically 1 hour), the refresh token should be used to obtain new tokens transparently — the user should not be logged out until the refresh token expires.

#### FR-13 — Cookie Names
Use the following cookie names:
- `id-token` — Cognito ID token JWT
- `access-token` — Cognito access token JWT
- `refresh-token` — Cognito refresh token (opaque)

### Protected Routes

#### FR-14 — Middleware Verification
The existing `middleware.ts` must be updated to verify JWT signature (not just token presence) before allowing access to protected routes.

#### FR-15 — API Route Verification
The `getCurrentUser` function in `lib/cognito.ts` must verify the JWT and extract the `sub` claim as the user ID.

#### FR-16 — Server Component Verification
The `getCurrentUserFromCookies` function must verify the JWT from cookies and return `{ id: sub }`.

### User Identity Mapping

#### FR-17 — ownerId = Cognito sub
The Cognito `sub` UUID must be used directly as the `ownerId` throughout the application. No intermediate mapping table is needed for the MVP.

#### FR-18 — No Local User Table
For the MVP, a local `User` table is NOT required. The user's identity is fully managed by Cognito. Profile information is handled by the optional `RescuerProfile` model.

#### FR-19 — Migration from Stub
The existing seed data uses `ownerId = "stub-user-id"`. After real auth is implemented:
- Development seed data should use a known Cognito user's `sub`.
- Existing database records with `"stub-user-id"` will need manual update or reseed.

---

## User Stories

### US-01 — Register
> **As a** new rescuer,  
> **I want to** create an account with my email and password,  
> **so that** I can access the platform's protected features.

### US-02 — Verify email
> **As a** new registrant,  
> **I want to** verify my email with a code,  
> **so that** Cognito confirms my identity.

### US-03 — Log in
> **As a** returning rescuer,  
> **I want to** log in with my credentials,  
> **so that** I can access my dashboard and manage my pets.

### US-04 — Stay logged in
> **As a** rescuer,  
> **I want** my session to persist across page refreshes,  
> **so that** I don't have to log in every time I visit.

### US-05 — Log out
> **As a** rescuer,  
> **I want to** log out securely,  
> **so that** no one can access my account from this device.

---

## Acceptance Criteria

### AC-01 — Registration creates Cognito user
- **Given** a new email and valid password,
- **When** the user submits the registration form,
- **Then** a new user is created in Cognito and a verification email is sent.

### AC-02 — Login sets httpOnly cookies
- **Given** valid credentials for a confirmed user,
- **When** they log in,
- **Then** ID, access, and refresh tokens are stored in httpOnly cookies.

### AC-03 — Protected routes reject expired tokens
- **Given** an expired access token (and expired refresh token),
- **When** a protected route is accessed,
- **Then** the user is redirected to /login.

### AC-04 — getCurrentUser returns real sub
- **Given** a valid JWT in the request,
- **When** `getCurrentUser` is called,
- **Then** it returns `{ id: "<cognito-sub-uuid>" }`.

### AC-05 — Middleware verifies signature
- **Given** a tampered JWT,
- **When** middleware processes the request,
- **Then** it redirects to /login (signature invalid).

### AC-06 — Logout clears cookies
- **Given** a logged-in user,
- **When** they click logout,
- **Then** all auth cookies are deleted and they're redirected to /login.

### AC-07 — Existing features still work
- **Given** the auth replacement is complete,
- **When** the user registers a pet, uploads photos, edits, etc.,
- **Then** all ownerId fields contain the real Cognito sub.
