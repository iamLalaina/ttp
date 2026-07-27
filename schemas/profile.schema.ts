import { z } from "zod";

/**
 * Rescuer profile validation schema.
 * Uses Zod v4 API.
 */

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

const ERR_NAME_REQUIRED = "Display name is required";
const ERR_NAME_TOO_LONG = "Display name must be 100 characters or fewer";
const ERR_BIO_TOO_SHORT = "Bio must be at least 10 characters";
const ERR_BIO_TOO_LONG = "Bio must be 500 characters or fewer";
const ERR_CITY_REQUIRED = "City is required";
const ERR_CITY_TOO_LONG = "City must be 100 characters or fewer";
const ERR_STATE_REQUIRED = "State is required";
const ERR_STATE_TOO_LONG = "State must be 100 characters or fewer";
const ERR_PHONE_TOO_LONG = "Phone must be 20 characters or fewer";
const ERR_WEBSITE_INVALID = "Must be a valid URL";
const ERR_WEBSITE_TOO_LONG = "URL must be 255 characters or fewer";
const ERR_IMAGE_INVALID = "Must be a valid URL";
const ERR_IMAGE_TOO_LONG = "URL must be 500 characters or fewer";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  displayName: z
    .string({ error: ERR_NAME_REQUIRED })
    .min(1, ERR_NAME_REQUIRED)
    .max(100, ERR_NAME_TOO_LONG),
  bio: z
    .string()
    .min(10, ERR_BIO_TOO_SHORT)
    .max(500, ERR_BIO_TOO_LONG),
  city: z
    .string({ error: ERR_CITY_REQUIRED })
    .min(1, ERR_CITY_REQUIRED)
    .max(100, ERR_CITY_TOO_LONG),
  state: z
    .string({ error: ERR_STATE_REQUIRED })
    .min(1, ERR_STATE_REQUIRED)
    .max(100, ERR_STATE_TOO_LONG),
  phone: z
    .string()
    .max(20, ERR_PHONE_TOO_LONG)
    .optional()
    .or(z.literal("")),
  websiteUrl: z
    .string()
    .url(ERR_WEBSITE_INVALID)
    .max(255, ERR_WEBSITE_TOO_LONG)
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .url(ERR_IMAGE_INVALID)
    .max(500, ERR_IMAGE_TOO_LONG)
    .optional()
    .or(z.literal("")),
});

export type ProfileSchemaInput = z.infer<typeof profileSchema>;
