import { NextRequest, NextResponse } from "next/server";
import { verifySchema } from "@/schemas/auth.schema";
import { getCognitoUser } from "@/lib/cognito-client";
import type { ApiResponse } from "@/types/api.types";

/**
 * POST /api/auth/verify
 *
 * Public endpoint. Confirms a user's email with the verification code.
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

    const parsed = verifySchema.safeParse(body);
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

    const { email, code } = parsed.data;

    // Dev mode bypass
    if (process.env.AUTH_DEV_MODE === "true") {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        { data: { message: "Dev mode: verification simulated." }, error: null },
        { status: 200 },
      );
    }

    const cognitoUser = getCognitoUser(email);

    await new Promise<void>((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: { message: "Email verified successfully. You can now log in." }, error: null },
      { status: 200 },
    );
  } catch (error: unknown) {
    const cognitoError = error as { code?: string; message?: string };
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: null, error: { code: cognitoError.code ?? "VERIFICATION_ERROR", message: cognitoError.message ?? "Verification failed" } },
      { status: 400 },
    );
  }
}
