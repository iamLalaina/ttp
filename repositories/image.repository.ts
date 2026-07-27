import type { PetImage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreatePetImageInput } from "@/types/image.types";

/**
 * Repository for the PetImage model.
 *
 * All direct Prisma calls for pet images live here.
 * Business logic belongs in the service layer (services/image.service.ts).
 */
export const imageRepository = {
  /** Insert a new PetImage record. */
  async create(data: CreatePetImageInput): Promise<PetImage> {
    return prisma.petImage.create({ data });
  },

  /** Return all images for a pet, ordered by position ascending. */
  async findByPetId(petId: string): Promise<PetImage[]> {
    return prisma.petImage.findMany({
      where: { petId },
      orderBy: { order: "asc" },
    });
  },

  /** Find a single image by its unique ID. */
  async findById(id: string): Promise<PetImage | null> {
    return prisma.petImage.findUnique({ where: { id } });
  },

  /** Return the count of images for a given pet (used for limit checks). */
  async countByPetId(petId: string): Promise<number> {
    return prisma.petImage.count({ where: { petId } });
  },

  /** Delete a single image record by ID. */
  async delete(id: string): Promise<void> {
    await prisma.petImage.delete({ where: { id } });
  },

  /**
   * Batch-update order fields in a single transaction.
   * Each entry in `updates` maps an image ID to its new order value.
   */
  async reorderInTransaction(
    updates: { id: string; order: number }[],
  ): Promise<void> {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.petImage.update({
          where: { id: u.id },
          data: { order: u.order },
        }),
      ),
    );
  },
};
