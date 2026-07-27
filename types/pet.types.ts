/**
 * Pet domain types.
 *
 * These types are manually maintained to mirror the Prisma Pet model and the
 * createPetSchema. The source of truth for validation rules is pet.schema.ts;
 * the source of truth for the database shape is prisma/schema.prisma.
 */

/** Input required to register a new pet. Mirrors the output of createPetSchema. */
export type CreatePetInput = {
  name: string;
  species: "dog" | "cat";
  breed: string;
  ageInMonths: number;
  sex: "male" | "female";
  size: "small" | "medium" | "large";
  healthStatus: string;
  vaccinationStatus: "up_to_date" | "partial" | "unknown";
  sterilized: "yes" | "no" | "unknown";
  friendlyWithChildren: "yes" | "no" | "unknown";
  friendlyWithAnimals: "yes" | "no" | "unknown";
  description: string;
  city: string;
  state: string;
};

/** Full persisted pet record as stored in and returned from the database. */
export type PetType = CreatePetInput & {
  id: string;
  ownerId: string;
  status: "draft" | "published" | "adopted";
  createdAt: Date;
  updatedAt: Date;
};

/** Pet record enriched with optional primary image URL for card display. */
export type PetWithPrimaryImage = PetType & {
  primaryImageUrl: string | null;
};

/** Input for updating an existing pet. All data fields + status (draft/published only). */
export type UpdatePetInput = CreatePetInput & {
  status: "draft" | "published";
};

// ---------------------------------------------------------------------------
// Public catalog types (never expose ownerId or management fields)
// ---------------------------------------------------------------------------

/** Subset of pet fields safe for public display on catalog cards. */
export type PublicPetCard = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  ageInMonths: number;
  sex: "male" | "female";
  size: "small" | "medium" | "large";
  city: string;
  state: string;
  primaryImageUrl: string | null;
};

/** Full public pet detail — all fields safe for adopters to see. */
export type PublicPetDetail = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  ageInMonths: number;
  sex: "male" | "female";
  size: "small" | "medium" | "large";
  healthStatus: string;
  vaccinationStatus: "up_to_date" | "partial" | "unknown";
  sterilized: "yes" | "no" | "unknown";
  friendlyWithChildren: "yes" | "no" | "unknown";
  friendlyWithAnimals: "yes" | "no" | "unknown";
  description: string;
  city: string;
  state: string;
  createdAt: Date;
};
