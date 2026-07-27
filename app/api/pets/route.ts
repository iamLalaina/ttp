import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/cognito";
import { createPetSchema } from "@/schemas/pet.schema";
import { createPet } from "@/services/pet.service";
import type { ApiResponse } from "@/types/api.types";
import type { PetType } from "@/types/pet.types";

/**
 * POST /api/pets
 *
 * Registers a new pet as a draft on behalf of the authenticated user.
 *
 * Request body: CreatePetInput (validated against createPetSchema)
 * Success:      201 { data: PetType, error: null }
 * Errors:       401 UNAUTHORIZED | 400 VALIDATION_ERROR | 500 INTERNAL_ERROR
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<PetType>>> {
  try {
    // 1. Auth check
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json<ApiResponse<PetType>>(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ApiResponse<PetType>>(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" },
        },
        { status: 400 },
      );
    }

    const parsed = createPetSchema.safeParse(body);
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

    // 3. Create pet via service layer
    const pet = await createPet(parsed.data, user.id);

    // 4. Return created pet
    return NextResponse.json<ApiResponse<PetType>>(
      { data: pet, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/pets]", error);
    return NextResponse.json<ApiResponse<PetType>>(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
