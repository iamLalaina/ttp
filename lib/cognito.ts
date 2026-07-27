import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * AWS Cognito authentication utilities for TTP.
 *
 * Provides JWT verification for:
 * - API Route Handlers (getCurrentUser)
 * - Server Components (getCurrentUserFromCookies)
 * - Middleware (verifyIdToken — exported for direct use)
 *
 * Development fallback:
 *   When AUTH_DEV_MODE=true (set in .env.local), JWT verification is skipped
 *   and any non-empty token is accepted with a configurable user ID.
 *   This preserves the local development workflow without AWS credentials.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEV_MODE = process.env.AUTH_DEV_MODE === "true";
const DEV_USER_ID = process.env.AUTH_DEV_USER_ID ?? "dev-user-id";

const REGION = process.env.AWS_REGION ?? "";
const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID ?? "";
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID ?? "";

const JWKS_URL = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

// Lazily initialized JWKS (only created when first needed in production mode)
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

// ---------------------------------------------------------------------------
// Token cookie name
// ---------------------------------------------------------------------------

export const ID_TOKEN_COOKIE = "id-token";
export const ACCESS_TOKEN_COOKIE = "access-token";
export const REFRESH_TOKEN_COOKIE = "refresh-token";

// ---------------------------------------------------------------------------
// Core verification
// ---------------------------------------------------------------------------

/**
 * Verifies a Cognito ID token JWT.
 *
 * In development mode (AUTH_DEV_MODE=true), any non-empty token is accepted
 * and returns a configurable dev user ID.
 *
 * In production mode, verifies:
 *   - JWT signature against Cognito JWKS
 *   - Issuer claim matches the User Pool
 *   - Audience claim matches the App Client ID
 *   - token_use claim is "id"
 *   - Token is not expired
 *
 * @returns { id: string } on success (id = Cognito sub), or null on failure.
 */
export async function verifyIdToken(
  token: string,
): Promise<{ id: string } | null> {
  if (!token) return null;

  // Development fallback — skip verification
  if (DEV_MODE) {
    //return { id: DEV_USER_ID };
    return { id: token.replace("dev-token-", "") };
  }

  // Production — full JWT verification
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: ISSUER,
      audience: CLIENT_ID,
    });

    // Ensure it's an ID token (not access token)
    if (payload.token_use !== "id") return null;
    if (!payload.sub) return null;

    return { id: payload.sub };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// For API Route Handlers
// ---------------------------------------------------------------------------

/**
 * Gets the current authenticated user from a NextRequest.
 * Reads the ID token from the cookie (preferred) or Authorization header.
 *
 * @returns { id: string } with the Cognito sub, or null if not authenticated.
 */
export async function getCurrentUser(
  req: NextRequest,
): Promise<{ id: string } | null> {
  const token =
    req.cookies.get(ID_TOKEN_COOKIE)?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    null;

  if (!token) return null;
  return verifyIdToken(token);
}

// ---------------------------------------------------------------------------
// For Server Components
// ---------------------------------------------------------------------------

/**
 * Gets the current authenticated user from cookies (Server Component context).
 * Uses next/headers cookies() to read the ID token.
 *
 * @returns { id: string } with the Cognito sub, or null if not authenticated.
 */
export async function getCurrentUserFromCookies(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ID_TOKEN_COOKIE)?.value;

  if (!token) return null;
  return verifyIdToken(token);
}
