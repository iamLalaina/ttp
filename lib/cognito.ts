import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Auth stub — getCurrentUser
 *
 * TODO: replace with real JWT verification (auth spec)
 *
 * This stub unblocks development of the API routes without requiring the full
 * Cognito authentication spec to be implemented first.
 *
 * Current behaviour:
 *   - Reads the Authorization header for a Bearer token.
 *   - If a token is present (any non-empty value), returns a stub user object.
 *   - If no token is present, returns null (treated as unauthenticated).
 *
 * When the auth spec is implemented, this function should:
 *   1. Verify the JWT signature against the Cognito JWKS endpoint.
 *   2. Validate expiry, issuer, and audience claims.
 *   3. Return { id: payload.sub } from the verified token.
 *   4. Return null on any verification failure.
 */
export async function getCurrentUser(
  req: NextRequest,
): Promise<{ id: string } | null> {
  // TODO: replace with real JWT verification (auth spec)
  console.warn(
    "[cognito.ts] getCurrentUser: JWT verification is not yet implemented. " +
      "Using stub — do not use in production.",
  );

  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("auth-token")?.value;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    return null;
  }

  // Stub: any token present is accepted; returns a fixed development user id.
  // TODO: replace with real JWT verification (auth spec)
  return { id: "stub-user-id" };
}


/**
 * Auth stub — getCurrentUserFromCookies
 *
 * TODO: replace with real JWT verification (auth spec)
 *
 * Variant of getCurrentUser designed for use in Server Components,
 * where there is no NextRequest object available. Instead reads the
 * auth-token from the cookies store via next/headers.
 *
 * Current behaviour:
 *   - Reads the `auth-token` cookie.
 *   - If a token is present, returns a stub user object.
 *   - If no token is present, returns null (unauthenticated).
 */
export async function getCurrentUserFromCookies(): Promise<{ id: string } | null> {
  // TODO: replace with real JWT verification (auth spec)

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  // Stub: any token present is accepted; returns a fixed development user id.
  // TODO: replace with real JWT verification (auth spec)
  return { id: "stub-user-id" };
}
