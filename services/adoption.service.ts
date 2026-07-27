import { prisma } from "@/lib/prisma";
import { adoptionRepository } from "@/repositories/adoption.repository";
import { petRepository } from "@/repositories/pet.repository";
import type {
  CreateAdoptionRequestInput,
  AdoptionRequestType,
  AdoptionRequestWithPet,
} from "@/types/adoption.types";

/**
 * Adoption service — business logic for adoption requests.
 *
 * Public operations: createAdoptionRequest
 * Owner operations: getRequestsForOwner, updateRequestStatus
 */

// ---------------------------------------------------------------------------
// Public: create adoption request
// ---------------------------------------------------------------------------

/**
 * Creates a new adoption request for a published pet.
 *
 * Business rules:
 * 1. Pet must exist and have status = "published".
 * 2. No duplicate pending request from the same email for the same pet.
 *
 * @throws AdoptionServiceError("NOT_FOUND") if pet not found or not published.
 * @throws AdoptionServiceError("DUPLICATE") if pending request already exists.
 */
export async function createAdoptionRequest(
  input: CreateAdoptionRequestInput,
): Promise<AdoptionRequestType> {
  // 1. Verify pet is published
  const pet = await petRepository.findPublishedById(input.petId);
  if (!pet) {
    throw new AdoptionServiceError("NOT_FOUND", "Pet not found or not available for adoption");
  }

  // 2. Check for duplicate pending request
  const existing = await adoptionRepository.findPendingByPetAndEmail(
    input.petId,
    input.applicantEmail,
  );
  if (existing) {
    throw new AdoptionServiceError(
      "DUPLICATE",
      "You already have a pending request for this pet",
    );
  }

  // 3. Create the request
  const request = await adoptionRepository.create(input);
  return request as AdoptionRequestType;
}

// ---------------------------------------------------------------------------
// Owner: get requests
// ---------------------------------------------------------------------------

/**
 * Returns all adoption requests for pets owned by the given user.
 * Includes pet name and primary image URL for inbox display.
 */
export async function getRequestsForOwner(
  ownerId: string,
): Promise<AdoptionRequestWithPet[]> {
  const requests = await adoptionRepository.findByOwnerPetsWithImages(ownerId);

  return requests.map((req) => ({
    id: req.id,
    petId: req.petId,
    applicantName: req.applicantName,
    applicantEmail: req.applicantEmail,
    message: req.message,
    status: req.status,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    petName: req.pet.name,
    petPrimaryImageUrl: req.pet.images[0]?.url ?? null,
  })) as AdoptionRequestWithPet[];
}

// ---------------------------------------------------------------------------
// Owner: update request status
// ---------------------------------------------------------------------------

/**
 * Updates a request's status, enforcing ownership and business rules.
 *
 * When accepting:
 *   1. Mark request as accepted
 *   2. Set pet status to "adopted"
 *   3. Reject all other pending requests for the same pet
 *   All wrapped in a Prisma transaction for atomicity.
 *
 * When rejecting:
 *   Just mark this request as rejected (no cascade).
 *
 * @throws AdoptionServiceError("NOT_FOUND") if request not found or not owned.
 * @throws AdoptionServiceError("ALREADY_PROCESSED") if request is not pending.
 */
export async function updateRequestStatus(
  requestId: string,
  status: "accepted" | "rejected",
  ownerId: string,
): Promise<AdoptionRequestType> {
  // 1. Find request with pet relation for ownership check
  const request = await adoptionRepository.findById(requestId);
  if (!request || request.pet.ownerId !== ownerId) {
    throw new AdoptionServiceError("NOT_FOUND", "Request not found");
  }

  // 2. Only pending requests can change status
  if (request.status !== "pending") {
    throw new AdoptionServiceError(
      "ALREADY_PROCESSED",
      "This request has already been processed",
    );
  }

  // 3. Execute the status change
  if (status === "accepted") {
    // Atomic cascade: accept this, reject others, mark pet adopted
    const updated = await prisma.$transaction(async (tx) => {
      // Accept this request
      const accepted = await tx.adoptionRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });

      // Reject all other pending requests for the same pet
      await tx.adoptionRequest.updateMany({
        where: {
          petId: request.petId,
          status: "pending",
          id: { not: requestId },
        },
        data: { status: "rejected" },
      });

      // Mark pet as adopted
      await tx.pet.update({
        where: { id: request.petId },
        data: { status: "adopted" },
      });

      return accepted;
    });

    return updated as AdoptionRequestType;
  }

  // Simple rejection — no cascade
  const updated = await adoptionRepository.updateStatus(requestId, "rejected");
  return updated as AdoptionRequestType;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class AdoptionServiceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AdoptionServiceError";
  }
}
