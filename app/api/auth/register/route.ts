import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/schemas/auth.schema";
import { getUserPool, CognitoUserAttribute } from "@/lib/cognito-client";
import type { ApiResponse } from "@/types/api.types";

/**
 * POST /api/auth/register
 *
 * Public endpoint. Creates a new Cognito user.
 * After success, user must verify email before logging in.
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

    const parsed = registerSchema.safeParse(body);
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

    // Dev mode bypass
    if (process.env.AUTH_DEV_MODE === "true") {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        { data: { message: "Dev mode: registration simulated. Proceed to login." }, error: null },
        { status: 201 },
      );
    }

    // Cognito signUp
    const userPool = getUserPool();
    const emailAttribute = new CognitoUserAttribute({
      Name: "email",
      Value: email,
    });

    await new Promise<void>((resolve, reject) => {
      userPool.signUp(email, password, [emailAttribute], [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: { message: "Registration successful. Check your email for the verification code." }, error: null },
      { status: 201 },
    );
  } catch (error: unknown) {
    const cognitoError = error as { code?: string; message?: string };
    const message = cognitoError.message ?? "Registration failed";
    const status = cognitoError.code === "UsernameExistsException" ? 409 : 400;

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: null, error: { code: cognitoError.code ?? "REGISTRATION_ERROR", message } },
      { status },
    );
  }
}
