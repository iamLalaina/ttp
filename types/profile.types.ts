/**
 * Rescuer profile domain types.
 */

/** Input for creating or updating a rescuer profile. */
export type CreateOrUpdateProfileInput = {
  displayName: string;
  bio: string;
  city: string;
  state: string;
  phone?: string | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
};

/** Full persisted rescuer profile record (includes ownerId — private use only). */
export type RescuerProfileType = {
  id: string;
  ownerId: string;
  displayName: string;
  bio: string;
  city: string;
  state: string;
  phone: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Public-safe subset of a rescuer profile — excludes ownerId. */
export type PublicRescuerProfile = {
  id: string;
  displayName: string;
  bio: string;
  city: string;
  state: string;
  phone: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
};
