import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Next.js Middleware — Route Protection
 *
 * Verifies the Cognito JWT from the id-token cookie.
 * Redirects to /login if the token is missing, expired, or invalid.
 *
 * Development mode (AUTH_DEV_MODE=true):
 *   Accepts any non-empty id-token cookie without verification.
 *
 * Protected routes (from the (main) App Router group):
 *   /dashboard, /profile, /requests, /pets/*
 *
 * Public routes (excluded via matcher):
 *   /, /catalog/*, /rescuers/*, /login, /register, /api/*, static files
 */

const DEV_MODE = process.env.AUTH_DEV_MODE === "true";
const REGION = process.env.AWS_REGION ?? "";
const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID ?? "";
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID ?? "";

const JWKS_URL = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get("id-token")?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  // Development mode — accept any non-empty token
  if (DEV_MODE) {
    return NextResponse.next();
  }

  // Production — verify JWT signature and claims
  try {
    await jwtVerify(token, getJwks(), {
      issuer: ISSUER,
      audience: CLIENT_ID,
    });
    return NextResponse.next();
  } catch {
    // Token invalid or expired — redirect to login
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - /api/*           → API routes handle their own auth
     *   - /_next/*         → Next.js internal assets
     *   - /login           → public auth page
     *   - /register        → public auth page
     *   - /               → landing page (public)
     *   - /catalog/*       → public pet catalog
     *   - /rescuers/*      → public rescuer profiles
     *   - Static files     → *.ico, *.png, *.svg, *.jpg, *.jpeg, *.webp, *.css, *.js
     */
    "/((?!api|_next/static|_next/image|login|register|catalog|rescuers|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js)$).*)",
  ],
};
