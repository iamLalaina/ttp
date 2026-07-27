import { z } from "zod";

/**
 * Pet registration validation schema.
 *
 * This schema is shared between the client (React Hook Form) and the server
 * (Route Handler), ensuring both sides enforce the same validation rules.
 *
 * All error messages are defined as constants at the top to enable easy
 * localization in the future.
 *
 * Note: uses Zod v4 API — `error` replaces the v3 `required_error`,
 * `invalid_type_error`, and `errorMap` options.
 */

// ---------------------------------------------------------------------------
// Error message constants
// ---------------------------------------------------------------------------

const ERR_NAME_REQUIRED = "Pet name is required";
const ERR_NAME_TOO_LONG = "Name must be 100 characters or fewer";

const ERR_SPECIES_INVALID = "Select a valid species";

const ERR_BREED_REQUIRED = "Breed is required";
const ERR_BREED_TOO_LONG = "Breed must be 100 characters or fewer";

const ERR_AGE_REQUIRED = "Age is required";
const ERR_AGE_NOT_INTEGER = "Age must be a whole number of months";
const ERR_AGE_NOT_POSITIVE = "Age must be at least 1 month";
const ERR_AGE_TOO_HIGH = "Age cannot exceed 300 months";

const ERR_SEX_INVALID = "Select a valid sex";

const ERR_SIZE_INVALID = "Select a valid size";

const ERR_HEALTH_REQUIRED = "Health status is required";
const ERR_HEALTH_TOO_LONG = "Health status must be 1000 characters or fewer";

const ERR_VACCINATION_INVALID = "Select a vaccination status";

const ERR_STERILIZED_INVALID = "Select a sterilization status";

const ERR_CHILDREN_INVALID = "Select an option for children compatibility";

const ERR_ANIMALS_INVALID = "Select an option for animal compatibility";

const ERR_DESCRIPTION_TOO_SHORT = "Description must be at least 10 characters";
const ERR_DESCRIPTION_TOO_LONG = "Description must be 500 characters or fewer";

const ERR_CITY_REQUIRED = "City is required";
const ERR_CITY_TOO_LONG = "City must be 100 characters or fewer";

const ERR_STATE_REQUIRED = "State is required";
const ERR_STATE_TOO_LONG = "State must be 100 characters or fewer";

// ---------------------------------------------------------------------------
// Schema definition
// ---------------------------------------------------------------------------

export const createPetSchema = z.object({
  // --- Basic info ---

  name: z
    .string({ error: ERR_NAME_REQUIRED })
    .min(1, ERR_NAME_REQUIRED)
    .max(100, ERR_NAME_TOO_LONG),

  species: z.enum(["dog", "cat"] as const, { error: ERR_SPECIES_INVALID }),

  breed: z
    .string({ error: ERR_BREED_REQUIRED })
    .min(1, ERR_BREED_REQUIRED)
    .max(100, ERR_BREED_TOO_LONG),

  ageInMonths: z
    .number({ error: ERR_AGE_REQUIRED })
    .int(ERR_AGE_NOT_INTEGER)
    .positive(ERR_AGE_NOT_POSITIVE)
    .max(300, ERR_AGE_TOO_HIGH),

  sex: z.enum(["male", "female"] as const, { error: ERR_SEX_INVALID }),

  size: z.enum(["small", "medium", "large"] as const, { error: ERR_SIZE_INVALID }),

  // --- Health & behavior ---

  healthStatus: z
    .string({ error: ERR_HEALTH_REQUIRED })
    .min(1, ERR_HEALTH_REQUIRED)
    .max(1000, ERR_HEALTH_TOO_LONG),

  vaccinationStatus: z.enum(["up_to_date", "partial", "unknown"] as const, {
    error: ERR_VACCINATION_INVALID,
  }),

  sterilized: z.enum(["yes", "no", "unknown"] as const, { error: ERR_STERILIZED_INVALID }),

  friendlyWithChildren: z.enum(["yes", "no", "unknown"] as const, {
    error: ERR_CHILDREN_INVALID,
  }),

  friendlyWithAnimals: z.enum(["yes", "no", "unknown"] as const, {
    error: ERR_ANIMALS_INVALID,
  }),

  // --- Location & description ---

  description: z
    .string()
    .min(10, ERR_DESCRIPTION_TOO_SHORT)
    .max(500, ERR_DESCRIPTION_TOO_LONG),

  city: z
    .string({ error: ERR_CITY_REQUIRED })
    .min(1, ERR_CITY_REQUIRED)
    .max(100, ERR_CITY_TOO_LONG),

  state: z
    .string({ error: ERR_STATE_REQUIRED })
    .min(1, ERR_STATE_REQUIRED)
    .max(100, ERR_STATE_TOO_LONG),
});

/**
 * Inferred TypeScript type from the schema.
 * This matches the manually maintained CreatePetInput type in types/pet.types.ts.
 */
export type CreatePetInput = z.infer<typeof createPetSchema>;


// ---------------------------------------------------------------------------
// Update schema (extends create with status field)
// ---------------------------------------------------------------------------

const ERR_STATUS_INVALID = "Select a valid status";

/**
 * Schema for updating an existing pet.
 * Same validation as createPetSchema + a required status field.
 * Only "draft" and "published" are valid — "adopted" is set via the adoption flow.
 */
export const updatePetSchema = createPetSchema.extend({
  status: z.enum(["draft", "published"] as const, { error: ERR_STATUS_INVALID }),
});

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
