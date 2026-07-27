import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { presignedUrlRequestSchema } from "@/schemas/upload.schema";
import { generatePresignedUploadUrl } from "@/services/storage.service";
import { petRepository } from "@/repositories/pet.repository";
import { imageRepository } from "@/repositories/image.repository";
import { MAX_IMAGES_PER_PET } from "@/schemas/upload.schema";
import type { ApiResponse } from "@/types/api.types";
import type { PresignedUrlResponse } from "@/types/image.types";

/**
 * POST /api/uploads/presigned-url
 *
 * Generates a presigned S3 PUT URL for direct client upload.
 *
 * Flow: Auth → validate body → ownership check → limit check → presign → return.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PresignedUrlResponse>>> {
  try {
    // 1. Auth
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    const parsed = presignedUrlRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
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

    const { petId, fileName, contentType, fileSize } = parsed.data;

    // 3. Ownership check
    const pet = await petRepository.findById(petId);
    if (!pet || pet.ownerId !== user.id) {
      return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
        { data: null, error: { code: "NOT_FOUND", message: "Pet not found" } },
        { status: 404 },
      );
    }

    // 4. Image limit check
    const currentCount = await imageRepository.countByPetId(petId);
    if (currentCount >= MAX_IMAGES_PER_PET) {
      return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `Maximum of ${MAX_IMAGES_PER_PET} images per pet`,
          },
        },
        { status: 400 },
      );
    }

    // 5. Generate presigned URL
    const result = await generatePresignedUploadUrl({
      petId,
      fileName,
      contentType,
      fileSize,
    });

    return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
      { data: result, error: null },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/uploads/presigned-url]", error);
    return NextResponse.json<ApiResponse<PresignedUrlResponse>>(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
