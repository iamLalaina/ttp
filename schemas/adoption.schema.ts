import { z } from "zod";

/**
 * Adoption request validation schemas.
 * Uses Zod v4 API.
 */

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

const ERR_PET_ID_REQUIRED = "Pet ID is required";
const ERR_NAME_REQUIRED = "Your name is required";
const ERR_NAME_TOO_LONG = "Name must be 100 characters or fewer";
const ERR_EMAIL_REQUIRED = "Email is required";
const ERR_EMAIL_INVALID = "Please enter a valid email address";
const ERR_MESSAGE_TOO_SHORT = "Message must be at least 10 characters";
const ERR_MESSAGE_TOO_LONG = "Message must be 1000 characters or fewer";
const ERR_STATUS_INVALID = "Status must be 'accepted' or 'rejected'";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating an adoption request (public form submission).
 * POST /api/adoption-requests
 */
export const createAdoptionRequestSchema = z.object({
  petId: z.string({ error: ERR_PET_ID_REQUIRED }).min(1, ERR_PET_ID_REQUIRED),
  applicantName: z
    .string({ error: ERR_NAME_REQUIRED })
    .min(1, ERR_NAME_REQUIRED)
    .max(100, ERR_NAME_TOO_LONG),
  applicantEmail: z
    .string({ error: ERR_EMAIL_REQUIRED })
    .email(ERR_EMAIL_INVALID),
  message: z
    .string()
    .min(10, ERR_MESSAGE_TOO_SHORT)
    .max(1000, ERR_MESSAGE_TOO_LONG),
});

/**
 * Schema for updating a request's status (owner action).
 * PATCH /api/adoption-requests/[id]
 */
export const updateRequestStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"] as const, { error: ERR_STATUS_INVALID }),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateAdoptionRequestSchemaInput = z.infer<typeof createAdoptionRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
