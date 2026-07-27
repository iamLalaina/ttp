import { imageRepository } from "@/repositories/image.repository";
import { petRepository } from "@/repositories/pet.repository";
import { deleteS3Object } from "@/services/storage.service";
import { MAX_IMAGES_PER_PET } from "@/schemas/upload.schema";
import type { PetImageType } from "@/types/image.types";

/**
 * Image service — business logic for pet photo management.
 *
 * Orchestrates between the image repository, pet repository (ownership),
 * and the storage service (S3). Does not catch errors — they propagate to
 * the Route Handler's try/catch.
 */

/**
 * Confirms a successful S3 upload by creating a PetImage record.
 *
 * @throws Error if pet not found, ownership fails, or image limit reached.
 */
export async function confirmImageUpload(params: {
  petId: string;
  s3Key: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  ownerId: string;
}): Promise<PetImageType> {
  // Ownership check
  const pet = await petRepository.findById(params.petId);
  if (!pet || pet.ownerId !== params.ownerId) {
    throw new ImageServiceError("NOT_FOUND", "Pet not found");
  }

  // Limit check
  const currentCount = await imageRepository.countByPetId(params.petId);
  if (currentCount >= MAX_IMAGES_PER_PET) {
    throw new ImageServiceError(
      "LIMIT_REACHED",
      `Maximum of ${MAX_IMAGES_PER_PET} images per pet`,
    );
  }

  // Determine next order position
  const order = currentCount;

  // Build the public URL (direct S3 URL for now; CloudFront in production)
  const bucketName = process.env.AWS_S3_BUCKET_NAME ?? "";
  const region = process.env.AWS_REGION ?? "us-east-1";
  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${params.s3Key}`;

  const image = await imageRepository.create({
    petId: params.petId,
    s3Key: params.s3Key,
    url,
    fileName: params.fileName,
    contentType: params.contentType,
    fileSize: params.fileSize,
    order,
  });

  return image as PetImageType;
}

/**
 * Deletes an image: removes from S3, deletes the record, and reorders remaining images.
 *
 * @throws ImageServiceError if pet not found, ownership fails, or image not found.
 */
export async function deleteImage(
  imageId: string,
  petId: string,
  ownerId: string,
): Promise<void> {
  // Ownership check
  const pet = await petRepository.findById(petId);
  if (!pet || pet.ownerId !== ownerId) {
    throw new ImageServiceError("NOT_FOUND", "Pet not found");
  }

  // Find the image
  const image = await imageRepository.findById(imageId);
  if (!image || image.petId !== petId) {
    throw new ImageServiceError("NOT_FOUND", "Image not found");
  }

  // Delete from S3
  await deleteS3Object(image.s3Key);

  // Delete from database
  await imageRepository.delete(imageId);

  // Reorder remaining images to fill the gap
  const remaining = await imageRepository.findByPetId(petId);
  if (remaining.length > 0) {
    const updates = remaining.map((img, index) => ({
      id: img.id,
      order: index,
    }));
    await imageRepository.reorderInTransaction(updates);
  }
}

/**
 * Reorders images for a pet. The `imageIds` array defines the new order
 * (index 0 = primary image).
 *
 * @throws ImageServiceError if ownership fails or imageIds don't match existing images.
 */
export async function reorderImages(
  petId: string,
  imageIds: string[],
  ownerId: string,
): Promise<PetImageType[]> {
  // Ownership check
  const pet = await petRepository.findById(petId);
  if (!pet || pet.ownerId !== ownerId) {
    throw new ImageServiceError("NOT_FOUND", "Pet not found");
  }

  // Validate that imageIds match exactly the existing images for this pet
  const existing = await imageRepository.findByPetId(petId);
  const existingIds = new Set(existing.map((img) => img.id));

  if (imageIds.length !== existing.length) {
    throw new ImageServiceError(
      "VALIDATION_ERROR",
      "Image IDs must include all existing images",
    );
  }

  for (const id of imageIds) {
    if (!existingIds.has(id)) {
      throw new ImageServiceError(
        "VALIDATION_ERROR",
        `Image ID "${id}" does not belong to this pet`,
      );
    }
  }

  // Build updates from array index → new order
  const updates = imageIds.map((id, index) => ({ id, order: index }));
  await imageRepository.reorderInTransaction(updates);

  // Return updated list
  const updated = await imageRepository.findByPetId(petId);
  return updated as PetImageType[];
}

/**
 * Returns all images for a pet, ordered by position.
 */
export async function getImagesForPet(petId: string): Promise<PetImageType[]> {
  const images = await imageRepository.findByPetId(petId);
  return images as PetImageType[];
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ImageServiceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ImageServiceError";
  }
}
