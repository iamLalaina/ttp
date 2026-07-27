/**
 * Pet image domain types.
 *
 * These types mirror the Prisma PetImage model and the upload schemas.
 */

/** Input to create a new PetImage record after a successful S3 upload. */
export type CreatePetImageInput = {
  petId: string;
  s3Key: string;
  url: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  order: number;
};

/** Full persisted PetImage record as stored in the database. */
export type PetImageType = {
  id: string;
  petId: string;
  s3Key: string;
  url: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  order: number;
  createdAt: Date;
};

/** Response shape from the presigned URL generation endpoint. */
export type PresignedUrlResponse = {
  url: string;
  s3Key: string;
};
