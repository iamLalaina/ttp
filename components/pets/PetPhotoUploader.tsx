"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_PET,
  ALLOWED_IMAGE_TYPES,
} from "@/schemas/upload.schema";
import type { ApiResponse } from "@/types/api.types";
import type { PetImageType, PresignedUrlResponse } from "@/types/image.types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetPhotoUploaderProps {
  petId: string;
  initialImages: PetImageType[];
}

// ---------------------------------------------------------------------------
// Helper: format file size
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PetPhotoUploader — Client Component
 *
 * Handles file selection, validation, S3 upload via presigned URLs,
 * and displays/manages existing images with delete capability.
 */
export function PetPhotoUploader({ petId, initialImages }: PetPhotoUploaderProps) {
  const [images, setImages] = useState<PetImageType[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAtLimit = images.length >= MAX_IMAGES_PER_PET;

  // -------------------------------------------------------------------------
  // Validate file client-side
  // -------------------------------------------------------------------------

  function validateFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      return "File type not supported. Accepted: JPEG, PNG, WebP.";
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `File exceeds maximum size of ${formatFileSize(MAX_IMAGE_SIZE_BYTES)}.`;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Upload flow
  // -------------------------------------------------------------------------

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      // Client-side validation
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (isAtLimit) {
        setError(`Maximum of ${MAX_IMAGES_PER_PET} images per pet.`);
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        // Step 1: Request presigned URL
        const presignedRes = await fetch("/api/uploads/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer stub-token",
          },
          body: JSON.stringify({
            petId,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        const presignedResult: ApiResponse<PresignedUrlResponse> =
          await presignedRes.json();

        if (!presignedRes.ok || presignedResult.error) {
          setError(presignedResult.error?.message ?? "Failed to get upload URL.");
          return;
        }

        const { url, s3Key } = presignedResult.data!;

        // Step 2: Upload file directly to S3 via presigned URL (XHR for progress)
        await uploadToS3(url, file);

        // Step 3: Confirm upload with the API
        const confirmRes = await fetch("/api/uploads/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer stub-token",
          },
          body: JSON.stringify({
            petId,
            s3Key,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        const confirmResult: ApiResponse<PetImageType> = await confirmRes.json();

        if (!confirmRes.ok || confirmResult.error) {
          setError(confirmResult.error?.message ?? "Failed to confirm upload.");
          return;
        }

        // Add to local state
        setImages((prev) => [...prev, confirmResult.data!]);
      } catch {
        setError("Upload failed. Please check your connection and try again.");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [petId, isAtLimit],
  );

  // -------------------------------------------------------------------------
  // S3 PUT with progress tracking (XMLHttpRequest)
  // -------------------------------------------------------------------------

  function uploadToS3(url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during S3 upload"));
      xhr.send(file);
    });
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  async function handleDelete(imageId: string) {
    setError(null);

    try {
      const res = await fetch(`/api/pets/${petId}/images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer stub-token" },
      });

      const result: ApiResponse<null> = await res.json();

      if (!res.ok || result.error) {
        setError(result.error?.message ?? "Failed to delete image.");
        return;
      }

      // Remove from local state and reindex
      setImages((prev) =>
        prev
          .filter((img) => img.id !== imageId)
          .map((img, idx) => ({ ...img, order: idx })),
      );
    } catch {
      setError("Delete failed. Please try again.");
    }
  }

  // -------------------------------------------------------------------------
  // File input & drag/drop handlers
  // -------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <section aria-labelledby="photo-uploader-heading" className="space-y-4">
      <h2
        id="photo-uploader-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Photos ({images.length} / {MAX_IMAGES_PER_PET})
      </h2>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Upload error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-border"
            >
              <Image
                src={img.url}
                alt={img.fileName}
                width={300}
                height={200}
                className="aspect-[3/2] w-full object-cover"
                
              />
              {img.order === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Delete ${img.fileName}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {!isAtLimit && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:border-ring"
        >
          <Upload className="size-8 text-muted-foreground" />

          {uploading ? (
            <div className="w-full max-w-xs space-y-1">
              <p className="text-sm text-muted-foreground">
                Uploading... {progress}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, or WebP — max {formatFileSize(MAX_IMAGE_SIZE_BYTES)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload pet photo"
          />
        </div>
      )}

      {isAtLimit && (
        <p className="text-center text-sm text-muted-foreground">
          Maximum of {MAX_IMAGES_PER_PET} images reached.
        </p>
      )}
    </section>
  );
}
