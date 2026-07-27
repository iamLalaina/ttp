import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { profileSchema } from "@/schemas/profile.schema";
import { upsertProfile } from "@/services/profile.service";
import type { ApiResponse } from "@/types/api.types";
import type { RescuerProfileType } from "@/types/profile.types";

/**
 * PUT /api/profile
 *
 * Auth required. Creates or updates the rescuer's profile (upsert).
 */
export async function PUT(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<RescuerProfileType>>> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<RescuerProfileType>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<RescuerProfileType>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<RescuerProfileType>>(
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

    const profile = await upsertProfile(user.id, parsed.data);

    return NextResponse.json<ApiResponse<RescuerProfileType>>(
      { data: profile, error: null },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PUT /api/profile]", error);
    return NextResponse.json<ApiResponse<RescuerProfileType>>(
      { data: null, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
