import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { updateRequestStatusSchema } from "@/schemas/adoption.schema";
import { updateRequestStatus, AdoptionServiceError } from "@/services/adoption.service";
import type { ApiResponse } from "@/types/api.types";
import type { AdoptionRequestType } from "@/types/adoption.types";

/**
 * PATCH /api/adoption-requests/[id]
 *
 * Auth required. Updates an adoption request's status (accept or reject).
 * Ownership is verified at the service layer.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<AdoptionRequestType>>> {
  try {
    // 1. Auth
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<AdoptionRequestType>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const { id } = await params;

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<AdoptionRequestType>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    const parsed = updateRequestStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<AdoptionRequestType>>(
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

    // 3. Update via service (ownership + business rules checked inside)
    const updated = await updateRequestStatus(id, parsed.data.status, user.id);

    return NextResponse.json<ApiResponse<AdoptionRequestType>>(
      { data: updated, error: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AdoptionServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json<ApiResponse<AdoptionRequestType>>(
        { data: null, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error("[PATCH /api/adoption-requests/[id]]", error);
    return NextResponse.json<ApiResponse<AdoptionRequestType>>(
      { data: null, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
