import { petRepository } from "@/repositories/pet.repository";
import { imageRepository } from "@/repositories/image.repository";
import type { CreatePetInput, PetType, PetWithPrimaryImage, UpdatePetInput } from "@/types/pet.types";

/**
 * Service layer for the Pet domain.
 *
 * Contains business logic and orchestration. Delegates all data access to the
 * repository layer. Does not catch errors — they propagate to the Route Handler.
 */

/**
 * Creates a new pet draft associated with the given owner.
 *
 * @param input - Validated pet registration data from createPetSchema.
 * @param ownerId - The authenticated user's Cognito sub (unique identifier).
 * @returns The fully persisted PetType record, including id, status, and timestamps.
 */
export async function createPet(
  input: CreatePetInput,
  ownerId: string,
): Promise<PetType> {
  // TODO: enforce draft limit per owner (future spec)
  // e.g., check count of existing drafts and throw if limit exceeded

  const pet = await petRepository.create({ ...input, ownerId });

  return pet as PetType;
}

/**
 * Retrieves a pet by ID, enforcing ownership.
 *
 * Returns null for both "not found" and "wrong owner" cases to prevent
 * leaking information about other users' pets through different error responses.
 *
 * @param id - The pet's unique CUID.
 * @param ownerId - The authenticated user's ID (Cognito sub).
 * @returns The full PetType or null if not found / not owned.
 */
export async function getPetByIdForOwner(
  id: string,
  ownerId: string,
): Promise<PetType | null> {
  const pet = await petRepository.findById(id);

  if (!pet) return null;
  if (pet.ownerId !== ownerId) return null;

  return pet as PetType;
}


/**
 * Returns all pets for the given owner, each enriched with its primary image URL.
 * Ordered by creation date descending (newest first).
 *
 * Uses a single query with a filtered include to avoid N+1.
 *
 * @param ownerId - The authenticated user's ID (Cognito sub).
 * @returns Array of PetWithPrimaryImage (may be empty).
 */
export async function getPetsForOwner(
  ownerId: string,
): Promise<PetWithPrimaryImage[]> {
  const pets = await petRepository.findByOwnerWithPrimaryImage(ownerId);

  return pets.map((pet) => {
    const { images, ...petData } = pet;
    return {
      ...petData,
      primaryImageUrl: images[0]?.url ?? null,
    } as PetWithPrimaryImage;
  });
}


/**
 * Updates an existing pet, enforcing ownership and business rules.
 *
 * Business rules:
 *   - Ownership must match.
 *   - Cannot publish a pet that has zero images.
 *
 * @throws PetServiceError("NOT_FOUND") if pet doesn't exist or not owned.
 * @throws PetServiceError("PUBLISH_REQUIRES_IMAGES") if attempting to publish without images.
 */
export async function updatePet(
  id: string,
  input: UpdatePetInput,
  ownerId: string,
): Promise<PetType> {
  // 1. Ownership check
  const existing = await petRepository.findById(id);
  if (!existing || existing.ownerId !== ownerId) {
    throw new PetServiceError("NOT_FOUND", "Pet not found");
  }

  // 2. Business rule: cannot publish without at least one image
  if (input.status === "published") {
    const imageCount = await imageRepository.countByPetId(id);
    if (imageCount === 0) {
      throw new PetServiceError(
        "PUBLISH_REQUIRES_IMAGES",
        "A pet must have at least one photo before publishing",
      );
    }
  }

  // 3. Update
  const updated = await petRepository.update(id, input);
  return updated as PetType;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class PetServiceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "PetServiceError";
  }
}
