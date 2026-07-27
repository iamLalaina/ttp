import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — Route Protection
 *
 * Protects authenticated routes by checking for the presence of an auth token.
 * Unauthenticated requests to protected paths are redirected to /login.
 *
 * TODO: verify JWT signature (auth spec)
 * Currently only checks for token presence. The auth spec will replace this
 * with full Cognito JWT signature and claims verification.
 *
 * Protected route groups (from the (main) App Router group):
 *   /pets/*
 *   /dashboard/*
 *   /requests/*
 */
export function middleware(req: NextRequest): NextResponse {
  // TODO: verify JWT signature (auth spec)
  // Presence-only check for now — any non-empty token is accepted.

  const token =
    req.cookies.get("auth-token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    // Preserve the original destination so the login page can redirect back after auth
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - /api/*         → API routes handle their own auth
     *   - /_next/*       → Next.js internal assets
     *   - /login         → public auth page (would cause redirect loop)
     *   - /register      → public auth page
     *   - /              → landing page (public)
     *   - /catalog/*     → public pet catalog
     *   - Static files   → *.ico, *.png, *.svg, *.jpg, *.jpeg, *.webp, *.css, *.js
     */
    "/((?!api|_next/static|_next/image|login|register|catalog|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js)$).*)",
  ],
};
