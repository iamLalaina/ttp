import { z } from "zod";

/**
 * Photo upload validation schemas.
 *
 * Shared between client (file picker validation) and server (Route Handlers).
 * Uses Zod v4 API — `error` replaces the v3 `required_error`/`errorMap` options.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_IMAGE_SIZE_BYTES = 5_242_880; // 5 MB
export const MAX_IMAGES_PER_PET = 6;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

const ERR_PET_ID_REQUIRED = "Pet ID is required";
const ERR_FILE_NAME_REQUIRED = "File name is required";
const ERR_FILE_NAME_TOO_LONG = "File name must be 255 characters or fewer";
const ERR_CONTENT_TYPE_INVALID = "File type not supported. Accepted: JPEG, PNG, WebP";
const ERR_FILE_SIZE_REQUIRED = "File size is required";
const ERR_FILE_SIZE_NOT_POSITIVE = "File size must be greater than 0";
const ERR_FILE_SIZE_TOO_LARGE = "File exceeds maximum size of 5 MB";
const ERR_S3_KEY_REQUIRED = "S3 key is required";
const ERR_IMAGE_IDS_REQUIRED = "Image IDs are required";
const ERR_IMAGE_IDS_TOO_MANY = "Cannot exceed 6 images";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Request body for presigned URL generation.
 * POST /api/uploads/presigned-url
 */
export const presignedUrlRequestSchema = z.object({
  petId: z.string({ error: ERR_PET_ID_REQUIRED }).min(1, ERR_PET_ID_REQUIRED),
  fileName: z
    .string({ error: ERR_FILE_NAME_REQUIRED })
    .min(1, ERR_FILE_NAME_REQUIRED)
    .max(255, ERR_FILE_NAME_TOO_LONG),
  contentType: z.enum(ALLOWED_IMAGE_TYPES, { error: ERR_CONTENT_TYPE_INVALID }),
  fileSize: z
    .number({ error: ERR_FILE_SIZE_REQUIRED })
    .int()
    .positive(ERR_FILE_SIZE_NOT_POSITIVE)
    .max(MAX_IMAGE_SIZE_BYTES, ERR_FILE_SIZE_TOO_LARGE),
});

/**
 * Request body for confirming a successful S3 upload.
 * POST /api/uploads/confirm
 */
export const confirmUploadSchema = z.object({
  petId: z.string({ error: ERR_PET_ID_REQUIRED }).min(1, ERR_PET_ID_REQUIRED),
  s3Key: z.string({ error: ERR_S3_KEY_REQUIRED }).min(1, ERR_S3_KEY_REQUIRED),
  fileName: z
    .string({ error: ERR_FILE_NAME_REQUIRED })
    .min(1, ERR_FILE_NAME_REQUIRED)
    .max(255, ERR_FILE_NAME_TOO_LONG),
  contentType: z.enum(ALLOWED_IMAGE_TYPES, { error: ERR_CONTENT_TYPE_INVALID }),
  fileSize: z
    .number({ error: ERR_FILE_SIZE_REQUIRED })
    .int()
    .positive(ERR_FILE_SIZE_NOT_POSITIVE)
    .max(MAX_IMAGE_SIZE_BYTES, ERR_FILE_SIZE_TOO_LARGE),
});

/**
 * Request body for reordering images.
 * PATCH /api/pets/[id]/images/reorder
 */
export const reorderImagesSchema = z.object({
  petId: z.string({ error: ERR_PET_ID_REQUIRED }).min(1, ERR_PET_ID_REQUIRED),
  imageIds: z
    .array(z.string().min(1), { error: ERR_IMAGE_IDS_REQUIRED })
    .min(1, ERR_IMAGE_IDS_REQUIRED)
    .max(MAX_IMAGES_PER_PET, ERR_IMAGE_IDS_TOO_MANY),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;
export type ConfirmUploadRequest = z.infer<typeof confirmUploadSchema>;
export type ReorderImagesRequest = z.infer<typeof reorderImagesSchema>;
