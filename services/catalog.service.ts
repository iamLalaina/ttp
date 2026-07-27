import { petRepository } from "@/repositories/pet.repository";
import type { PublicPetCard, PublicPetDetail } from "@/types/pet.types";

/**
 * Public catalog service.
 *
 * Contains queries for the public-facing catalog pages.
 * Never exposes ownerId or management operations.
 * All queries filter by status = "published" at the repository level.
 */

/**
 * Returns all published pets for the public catalog, each with its primary image URL.
 * Ordered by most recently updated (proxy for "most recently published").
 */
export async function getPublishedPets(): Promise<PublicPetCard[]> {
  const pets = await petRepository.findPublishedWithPrimaryImage();

  return pets.map((pet) => ({
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    ageInMonths: pet.ageInMonths,
    sex: pet.sex,
    size: pet.size,
    city: pet.city,
    state: pet.state,
    primaryImageUrl: pet.images[0]?.url ?? null,
  }));
}

/**
 * Returns a single published pet's public-facing detail.
 * Returns null if the pet doesn't exist or isn't published.
 */
export async function getPublishedPetById(
  id: string,
): Promise<PublicPetDetail | null> {
  const pet = await petRepository.findPublishedById(id);

  if (!pet) return null;

  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    ageInMonths: pet.ageInMonths,
    sex: pet.sex,
    size: pet.size,
    healthStatus: pet.healthStatus,
    vaccinationStatus: pet.vaccinationStatus,
    sterilized: pet.sterilized,
    friendlyWithChildren: pet.friendlyWithChildren,
    friendlyWithAnimals: pet.friendlyWithAnimals,
    description: pet.description,
    city: pet.city,
    state: pet.state,
    createdAt: pet.createdAt,
  };
}
