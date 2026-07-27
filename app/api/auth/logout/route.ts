import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-cookies";
import type { ApiResponse } from "@/types/api.types";

/**
 * POST /api/auth/logout
 *
 * Clears all auth cookies. No Cognito server-side call needed
 * (tokens become invalid when cleared from the client).
 */
export async function POST(): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  const response = NextResponse.json<ApiResponse<{ message: string }>>(
    { data: { message: "Logged out successfully." }, error: null },
    { status: 200 },
  );

  return clearAuthCookies(response);
}
