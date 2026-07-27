import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { reorderImagesSchema } from "@/schemas/upload.schema";
import { reorderImages, ImageServiceError } from "@/services/image.service";
import type { ApiResponse } from "@/types/api.types";
import type { PetImageType } from "@/types/image.types";

/**
 * PATCH /api/pets/[id]/images/reorder
 *
 * Reorders images for a pet. The request body contains an array of image IDs
 * in the desired order (index 0 = primary image).
 *
 * Flow: Auth → validate body → reorder via service → return updated list.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<PetImageType[]>>> {
  try {
    // 1. Auth
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<PetImageType[]>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const { id: petId } = await params;

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<PetImageType[]>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    // Inject petId from URL into validation (override any petId in body)
    const parsed = reorderImagesSchema.safeParse({ ...body as object, petId });
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<PetImageType[]>>(
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

    // 3. Reorder via service (ownership + validation checked inside)
    const updated = await reorderImages(petId, parsed.data.imageIds, user.id);

    return NextResponse.json<ApiResponse<PetImageType[]>>(
      { data: updated, error: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ImageServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json<ApiResponse<PetImageType[]>>(
        { data: null, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error("[PATCH /api/pets/[id]/images/reorder]", error);
    return NextResponse.json<ApiResponse<PetImageType[]>>(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
