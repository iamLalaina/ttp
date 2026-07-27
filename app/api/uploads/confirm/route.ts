import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { confirmUploadSchema } from "@/schemas/upload.schema";
import { confirmImageUpload, ImageServiceError } from "@/services/image.service";
import type { ApiResponse } from "@/types/api.types";
import type { PetImageType } from "@/types/image.types";

/**
 * POST /api/uploads/confirm
 *
 * Confirms a successful S3 upload by creating the PetImage record.
 * Called by the client after the presigned PUT to S3 succeeds.
 *
 * Flow: Auth → validate body → confirm via service → return 201.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PetImageType>>> {
  try {
    // 1. Auth
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<PetImageType>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<PetImageType>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    const parsed = confirmUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<PetImageType>>(
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

    // 3. Confirm upload via image service (ownership + limit checked inside)
    const image = await confirmImageUpload({
      petId: parsed.data.petId,
      s3Key: parsed.data.s3Key,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      fileSize: parsed.data.fileSize,
      ownerId: user.id,
    });

    return NextResponse.json<ApiResponse<PetImageType>>(
      { data: image, error: null },
      { status: 201 },
    );
  } catch (error) {
    // Handle known service errors
    if (error instanceof ImageServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json<ApiResponse<PetImageType>>(
        { data: null, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error("[POST /api/uploads/confirm]", error);
    return NextResponse.json<ApiResponse<PetImageType>>(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
