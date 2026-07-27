import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { updatePetSchema } from "@/schemas/pet.schema";
import { updatePet, PetServiceError } from "@/services/pet.service";
import type { ApiResponse } from "@/types/api.types";
import type { PetType } from "@/types/pet.types";

/**
 * PATCH /api/pets/[id]
 *
 * Updates an existing pet record. Requires authentication and ownership.
 *
 * Request body: UpdatePetInput (validated against updatePetSchema)
 * Success:      200 { data: PetType, error: null }
 * Errors:       401 | 400 | 404 | 500
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<PetType>>> {
  try {
    // 1. Auth
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<PetType>>(
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
      return NextResponse.json<ApiResponse<PetType>>(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" } },
        { status: 400 },
      );
    }

    const parsed = updatePetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<PetType>>(
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
    const pet = await updatePet(id, parsed.data, user.id);

    return NextResponse.json<ApiResponse<PetType>>(
      { data: pet, error: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof PetServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json<ApiResponse<PetType>>(
        { data: null, error: { code: error.code, message: error.message } },
        { status },
      );
    }

    console.error("[PATCH /api/pets/[id]]", error);
    return NextResponse.json<ApiResponse<PetType>>(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
