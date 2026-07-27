import { NextRequest, NextResponse } from "next/server";
import { CognitoRefreshToken } from "amazon-cognito-identity-js";
import { getCognitoUser } from "@/lib/cognito-client";
import { setAuthCookies } from "@/lib/auth-cookies";
import { REFRESH_TOKEN_COOKIE, ID_TOKEN_COOKIE } from "@/lib/cognito";
import type { ApiResponse } from "@/types/api.types";
import type { CognitoUserSession } from "amazon-cognito-identity-js";

/**
 * POST /api/auth/refresh
 *
 * Uses the refresh token to obtain new ID and access tokens.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const refreshTokenValue = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshTokenValue) {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "No refresh token" } },
        { status: 401 },
      );
    }

    // Dev mode bypass
    if (process.env.AUTH_DEV_MODE === "true") {
      const devUserId = process.env.AUTH_DEV_USER_ID ?? "dev-user-id";
      const response = NextResponse.json<ApiResponse<{ message: string }>>(
        { data: { message: "Dev mode: refresh simulated." }, error: null },
        { status: 200 },
      );
      response.cookies.set(ID_TOKEN_COOKIE, `dev-token-${devUserId}`, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 86400,
      });
      return response;
    }

    // Extract email from the existing ID token to identify the user
    // In production, you'd decode the ID token to get the username
    const idToken = req.cookies.get(ID_TOKEN_COOKIE)?.value;
    if (!idToken) {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "No ID token for refresh" } },
        { status: 401 },
      );
    }

    // Decode the expired token (without verification) to get the email
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString(),
    );
    const email = payload.email ?? payload["cognito:username"];

    if (!email) {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Cannot identify user for refresh" } },
        { status: 401 },
      );
    }

    const cognitoUser = getCognitoUser(email);
    const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenValue });

    const session = await new Promise<CognitoUserSession>((resolve, reject) => {
      cognitoUser.refreshSession(refreshToken, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const newIdToken = session.getIdToken().getJwtToken();
    const newAccessToken = session.getAccessToken().getJwtToken();

    const response = NextResponse.json<ApiResponse<{ message: string }>>(
      { data: { message: "Tokens refreshed." }, error: null },
      { status: 200 },
    );

    return setAuthCookies(response, {
      idToken: newIdToken,
      accessToken: newAccessToken,
      refreshToken: refreshTokenValue, // Keep the same refresh token
    });
  } catch (error: unknown) {
    const cognitoError = error as { message?: string };
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: null, error: { code: "REFRESH_ERROR", message: cognitoError.message ?? "Token refresh failed" } },
      { status: 401 },
    );
  }
}
