import { NextResponse } from "next/server";
import {
  ID_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/cognito";

/**
 * Cookie helpers for auth token management.
 * Tokens are stored in httpOnly secure cookies — never in localStorage.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Sets all three auth cookies on a NextResponse.
 */
export function setAuthCookies<T>(
  response: NextResponse<T>,
  tokens: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  },
): NextResponse<T> {
  response.cookies.set(ID_TOKEN_COOKIE, tokens.idToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 3600, // 1 hour
  });
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 3600, // 1 hour
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 30 * 24 * 3600, // 30 days
  });
  return response;
}

/**
 * Clears all auth cookies from a NextResponse.
 */
export function clearAuthCookies<T>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.set(ID_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS_BASE, maxAge: 0 });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS_BASE, maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS_BASE, maxAge: 0 });
  return response;
}
