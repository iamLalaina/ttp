import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/schemas/auth.schema";
import { getCognitoUser, AuthenticationDetails } from "@/lib/cognito-client";
import { setAuthCookies } from "@/lib/auth-cookies";
import { ID_TOKEN_COOKIE } from "@/lib/cognito";
import type { ApiResponse } from "@/types/api.types";
import type { CognitoUserSession } from "amazon-cognito-identity-js";

/**
 * POST /api/auth/login
 *
 * Public endpoint. Authenticates a user and sets httpOnly cookies.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
        { status: 400 },
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((i) => i.message).join("; "),
          },
        },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // Dev mode bypass — set a dev cookie
    if (process.env.AUTH_DEV_MODE === "true") {
      const devUserId = process.env.AUTH_DEV_USER_ID ?? "dev-user-id";
      const response = NextResponse.json<ApiResponse<{ message: string }>>(
        { data: { message: "Dev mode: login successful." }, error: null },
        { status: 200 },
      );
      // Set a simple dev token that verifyIdToken will accept in dev mode
      response.cookies.set(ID_TOKEN_COOKIE, `dev-token-${devUserId}`, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 86400, // 24h for dev
      });
      return response;
    }

    // Cognito authentication
    const cognitoUser = getCognitoUser(email);
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const session = await new Promise<CognitoUserSession>((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err),
      });
    });

    const idToken = session.getIdToken().getJwtToken();
    const accessToken = session.getAccessToken().getJwtToken();
    const refreshToken = session.getRefreshToken().getToken();

    const response = NextResponse.json<ApiResponse<{ message: string }>>(
      { data: { message: "Login successful." }, error: null },
      { status: 200 },
    );

    return setAuthCookies(response, { idToken, accessToken, refreshToken });
  } catch (error: unknown) {
    const cognitoError = error as { code?: string; message?: string };
    const message = cognitoError.message ?? "Login failed";

    let status = 401;
    if (cognitoError.code === "UserNotConfirmedException") status = 403;
    if (cognitoError.code === "UserNotFoundException") status = 404;

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: null, error: { code: cognitoError.code ?? "AUTH_ERROR", message } },
      { status },
    );
  }
}
