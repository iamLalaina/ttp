/**
 * Amazon S3 client singleton — Tracing Tiny Paws (TTP)
 *
 * Uses AWS SDK v3 (@aws-sdk/client-s3).
 * The singleton pattern prevents multiple S3Client instances during
 * Next.js hot-reload in development.
 *
 * Required environment variables:
 *   AWS_REGION
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 */

import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as {
  s3: S3Client | undefined;
};

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export const s3 = globalForS3.s3 ?? createS3Client();

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3;
}
