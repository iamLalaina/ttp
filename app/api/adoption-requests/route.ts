import { NextRequest, NextResponse } from "next/server";
import { createAdoptionRequestSchema } from "@/schemas/adoption.schema";
import { createAdoptionRequest, AdoptionServiceError } from "@/services/adoption.service";
import type { ApiResponse } from "@/types/api.types";
import type { AdoptionRequestType } from "@/types/adoption.types";

/**
 * POST /api/adoption-requests
 *
 * Public endpoint — no authentication required.
 * Creates a new adoption request for a published pet.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<AdoptionRequestType>>> {
  try {
    // 1. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<AdoptionRequestType>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    const parsed = createAdoptionRequestSchema.safeParse(body);
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

    // 2. Create via service
    const request = await createAdoptionRequest(parsed.data);

    return NextResponse.json<ApiResponse<AdoptionRequestType>>(
      { data: request, error: null },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AdoptionServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json<ApiResponse<AdoptionRequestType>>(
        { data: null, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error("[POST /api/adoption-requests]", error);
    return NextResponse.json<ApiResponse<AdoptionRequestType>>(
      { data: null, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
