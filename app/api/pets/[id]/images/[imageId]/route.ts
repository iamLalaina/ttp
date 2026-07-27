import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { deleteImage, ImageServiceError } from "@/services/image.service";
import type { ApiResponse } from "@/types/api.types";

/**
 * DELETE /api/pets/[id]/images/[imageId]
 *
 * Deletes a pet image: removes the S3 object, the database record,
 * and reorders remaining images to fill the gap.
 *
 * Flow: Auth → ownership check (in service) → delete S3 → delete DB → reorder → 200.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    // 1. Auth
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const { id: petId, imageId } = await params;

    // 2. Delete via service (ownership + existence checked inside)
    await deleteImage(imageId, petId, user.id);

    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ImageServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error("[DELETE /api/pets/[id]/images/[imageId]]", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
