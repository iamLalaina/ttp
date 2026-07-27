import type { AdoptionRequest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateAdoptionRequestInput } from "@/types/adoption.types";

/**
 * Repository for the AdoptionRequest model.
 *
 * All direct Prisma calls for adoption requests live here.
 * Business logic belongs in services/adoption.service.ts.
 */
export const adoptionRepository = {
  /** Insert a new adoption request. */
  async create(data: CreateAdoptionRequestInput): Promise<AdoptionRequest> {
    return prisma.adoptionRequest.create({ data });
  },

  /** Find a single request by ID, including its pet relation (for ownership check). */
  async findById(
    id: string,
  ): Promise<(AdoptionRequest & { pet: { ownerId: string } }) | null> {
    return prisma.adoptionRequest.findUnique({
      where: { id },
      include: { pet: { select: { ownerId: true } } },
    });
  },

  /**
   * Find an existing pending request for a given pet + email.
   * Used for duplicate prevention at the service layer.
   */
  async findPendingByPetAndEmail(
    petId: string,
    email: string,
  ): Promise<AdoptionRequest | null> {
    return prisma.adoptionRequest.findFirst({
      where: { petId, applicantEmail: email, status: "pending" },
    });
  },

  /**
   * Find all requests for pets owned by a given user.
   * Includes pet id, name, and primary image (order 0) — single query, no N+1.
   * Ordered by createdAt descending (newest first).
   */
  async findByOwnerPetsWithImages(ownerId: string) {
    return prisma.adoptionRequest.findMany({
      where: { pet: { ownerId } },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            images: { where: { order: 0 }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Update the status of a single request. */
  async updateStatus(
    id: string,
    status: "accepted" | "rejected",
  ): Promise<AdoptionRequest> {
    return prisma.adoptionRequest.update({
      where: { id },
      data: { status },
    });
  },

  /**
   * Reject all pending requests for a pet, excluding one specific request.
   * Used during the accept cascade.
   */
  async rejectAllPendingForPet(
    petId: string,
    excludeId: string,
  ): Promise<void> {
    await prisma.adoptionRequest.updateMany({
      where: {
        petId,
        status: "pending",
        id: { not: excludeId },
      },
      data: { status: "rejected" },
    });
  },
};
