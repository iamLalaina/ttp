import type { RescuerProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateOrUpdateProfileInput } from "@/types/profile.types";

/**
 * Repository for the RescuerProfile model.
 */
export const profileRepository = {
  /** Find a profile by the owner's ID (Cognito sub). */
  async findByOwnerId(ownerId: string): Promise<RescuerProfile | null> {
    return prisma.rescuerProfile.findUnique({ where: { ownerId } });
  },

  /** Find a profile by its public CUID (used in /rescuers/[id] URLs). */
  async findById(id: string): Promise<RescuerProfile | null> {
    return prisma.rescuerProfile.findUnique({ where: { id } });
  },

  /** Create or update a profile for the given owner. */
  async upsert(
    ownerId: string,
    data: CreateOrUpdateProfileInput,
  ): Promise<RescuerProfile> {
    return prisma.rescuerProfile.upsert({
      where: { ownerId },
      create: { ownerId, ...data },
      update: data,
    });
  },
};
