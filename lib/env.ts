import { z } from "zod";

/**
 * Environment variable validation — Tracing Tiny Paws (TTP)
 *
 * Core variables are validated eagerly at startup. S3 variables are validated
 * lazily (only when the storage service is invoked) to avoid blocking
 * development workflows that don't require S3 access.
 */

// ---------------------------------------------------------------------------
// Core env schema (validated at startup)
// ---------------------------------------------------------------------------

const coreEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_COGNITO_USER_POOL_ID: z.string().min(1, "AWS_COGNITO_USER_POOL_ID is required"),
  AWS_COGNITO_CLIENT_ID: z.string().min(1, "AWS_COGNITO_CLIENT_ID is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
});

function validateCoreEnv(): z.infer<typeof coreEnvSchema> {
  const parsed = coreEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_REGION: process.env.AWS_REGION,
    AWS_COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID,
    AWS_COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateCoreEnv();

// ---------------------------------------------------------------------------
// S3 env schema (validated on demand when storage features are used)
// ---------------------------------------------------------------------------

const s3EnvSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_S3_BUCKET_NAME: z.string().min(1, "AWS_S3_BUCKET_NAME is required"),
});

/**
 * Validates that all S3-related environment variables are present.
 * Call this at the top of any service that uses S3.
 *
 * @throws Error with field-level details if any variable is missing.
 */
export function validateS3Env(): z.infer<typeof s3EnvSchema> {
  const parsed = s3EnvSchema.safeParse({
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  });

  if (!parsed.success) {
    console.error("❌ Missing S3 environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("S3 environment variables are not configured");
  }

  return parsed.data;
}
