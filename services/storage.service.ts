import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "@/schemas/upload.schema";
import type { PresignedUrlResponse } from "@/types/image.types";

/**
 * Storage service — S3 operations for pet image uploads.
 *
 * Handles presigned URL generation and object deletion.
 * Never touches the database — that's the image service's job.
 */

/**
 * Sanitizes a file name for use in an S3 key.
 * Removes special characters, replaces spaces with hyphens, lowercases.
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Generates an S3 key following the pattern: pets/{petId}/{timestamp}-{sanitizedFileName}
 */
function generateS3Key(petId: string, fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  return `pets/${petId}/${Date.now()}-${sanitized}`;
}

/**
 * Generates a presigned PUT URL for direct client-to-S3 upload.
 *
 * The presigned URL includes Content-Type and Content-Length conditions
 * so the client cannot upload a different file type or a larger file.
 */
export async function generatePresignedUploadUrl(params: {
  petId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<PresignedUrlResponse> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  const s3Key = generateS3Key(params.petId, params.fileName);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ContentType: params.contentType,
    ContentLength: params.fileSize,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });

  return { url, s3Key };
}

/**
 * Deletes an object from S3 by its key.
 *
 * Does not throw if the object doesn't exist (S3 DELETE is idempotent).
 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  await s3.send(command);
}
