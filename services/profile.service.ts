import { profileRepository } from "@/repositories/profile.repository";
import type {
  CreateOrUpdateProfileInput,
  RescuerProfileType,
  PublicRescuerProfile,
} from "@/types/profile.types";

/**
 * Rescuer profile service.
 *
 * Profiles are optional — created only when the rescuer chooses to set one up.
 */

/**
 * Creates or updates the rescuer's profile.
 * Sanitizes empty optional fields to null before persisting.
 */
export async function upsertProfile(
  ownerId: string,
  input: CreateOrUpdateProfileInput,
): Promise<RescuerProfileType> {
  // Sanitize empty strings to null for optional fields
  const sanitized: CreateOrUpdateProfileInput = {
    displayName: input.displayName,
    bio: input.bio,
    city: input.city,
    state: input.state,
    phone: input.phone || null,
    websiteUrl: input.websiteUrl || null,
    imageUrl: input.imageUrl || null,
  };

  const profile = await profileRepository.upsert(ownerId, sanitized);
  return profile as RescuerProfileType;
}

/**
 * Gets the current user's profile (for the private management page).
 * Returns null if no profile has been created yet.
 */
export async function getProfileForOwner(
  ownerId: string,
): Promise<RescuerProfileType | null> {
  const profile = await profileRepository.findByOwnerId(ownerId);
  return profile as RescuerProfileType | null;
}

/**
 * Gets a profile by its public ID (CUID) for the public rescuer page.
 * Returns the full record (ownerId needed server-side for pet lookup).
 */
export async function getProfileById(
  profileId: string,
): Promise<RescuerProfileType | null> {
  const profile = await profileRepository.findById(profileId);
  return profile as RescuerProfileType | null;
}

/**
 * Gets a public-safe profile by owner ID.
 * Used by catalog integration to link pet → rescuer without exposing ownerId publicly.
 * Returns null if the rescuer has no profile (profiles are optional).
 */
export async function getPublicProfileByOwnerId(
  ownerId: string,
): Promise<PublicRescuerProfile | null> {
  const profile = await profileRepository.findByOwnerId(ownerId);
  if (!profile) return null;

  return {
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    city: profile.city,
    state: profile.state,
    phone: profile.phone,
    websiteUrl: profile.websiteUrl,
    imageUrl: profile.imageUrl,
  };
}
