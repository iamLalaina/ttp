import type { Pet, PetImage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreatePetInput, UpdatePetInput } from "@/types/pet.types";

/**
 * Repository for the Pet model.
 *
 * All direct Prisma calls for the Pet entity live here.
 * Business logic belongs in the service layer (services/pet.service.ts).
 */
export const petRepository = {
  /**
   * Persists a new pet record associated with the given owner.
   * The `status` field is intentionally omitted — the Prisma schema default
   * of `draft` is applied at the database level.
   */
  async create(data: CreatePetInput & { ownerId: string }): Promise<Pet> {
    return prisma.pet.create({ data });
  },

  /**
   * Retrieves a single pet by its unique CUID.
   * Returns null if no record matches.
   */
  async findById(id: string): Promise<Pet | null> {
    return prisma.pet.findUnique({ where: { id } });
  },

  /**
   * Finds all pets for a given owner, newest first.
   * Includes only the primary image (order 0) for each pet to avoid
   * loading the full image set for card display.
   */
  async findByOwnerWithPrimaryImage(
    ownerId: string,
  ): Promise<(Pet & { images: PetImage[] })[]> {
    return prisma.pet.findMany({
      where: { ownerId },
      include: {
        images: {
          where: { order: 0 },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Finds all published pets with their primary image.
   * Used by the public catalog — never accepts ownerId.
   * Ordered by updatedAt descending (proxy for most recently published).
   */
  async findPublishedWithPrimaryImage(): Promise<(Pet & { images: PetImage[] })[]> {
    return prisma.pet.findMany({
      where: { status: "published" },
      include: {
        images: {
          where: { order: 0 },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  /**
   * Finds a single published pet by ID.
   * Returns null if the pet doesn't exist or is not published.
   * Used by the public detail page — prevents access to drafts/adopted.
   */
  async findPublishedById(id: string): Promise<Pet | null> {
    return prisma.pet.findFirst({
      where: { id, status: "published" },
    });
  },

  /**
   * Updates a pet record by ID with the provided data.
   * Caller must verify ownership before calling this method.
   */
  async update(id: string, data: UpdatePetInput): Promise<Pet> {
    return prisma.pet.update({ where: { id }, data });
  },

  /**
   * Finds all published pets for a specific owner, with primary image.
   * Used by the public rescuer profile page.
   */
  async findPublishedByOwnerWithPrimaryImage(
    ownerId: string,
  ): Promise<(Pet & { images: PetImage[] })[]> {
    return prisma.pet.findMany({
      where: { ownerId, status: "published" },
      include: {
        images: {
          where: { order: 0 },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },
};
