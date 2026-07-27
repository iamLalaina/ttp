# Implementation Tasks — Photo Upload

## References
- #[[file:.kiro/specs/photo-upload/requirements.md]]
- #[[file:.kiro/specs/photo-upload/design.md]]

---

## Task Order Rationale

Tasks follow the same bottom-up dependency order:
**schema → types → repository → services → API routes → client components → integration → verification**

S3 infrastructure is set up first since services depend on it.

---

## Tasks

- [x] **Task 1 — Install AWS SDK packages**
  - Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
  - Verify they resolve correctly.

- [x] **Task 2 — Prisma schema: PetImage model**
  - Add the `PetImage` model to `prisma/schema.prisma` as specified in design.md.
  - Add the `images PetImage[]` relation to the existing `Pet` model.
  - Run `npx prisma validate`.
  - Run `npx prisma migrate dev --name add-pet-image-model`.
  - Run `npx prisma generate` to regenerate the client.

- [x] **Task 3 — TypeScript types**
  - Create `types/image.types.ts` exporting `CreatePetImageInput`, `PetImageType`, and `PresignedUrlResponse`.

- [x] **Task 4 — Zod validation schemas**
  - Create `schemas/upload.schema.ts` exporting:
    - `presignedUrlRequestSchema`
    - `confirmUploadSchema`
    - `reorderImagesSchema`
  - Define all validation error messages as constants.
  - Use Zod 4 API (same patterns as `pet.schema.ts`).

- [x] **Task 5 — S3 client singleton**
  - Create `lib/s3.ts` exporting a singleton `S3Client` instance.
  - Use `globalThis` pattern for hot-reload safety (same as `lib/prisma.ts`).
  - Read credentials from environment variables.

- [x] **Task 6 — Image repository**
  - Create `repositories/image.repository.ts` with methods:
    - `create(data)` — insert a PetImage record
    - `findByPetId(petId)` — return all images ordered by `order` asc
    - `findById(id)` — single image lookup
    - `countByPetId(petId)` — return count of images for limit checking
    - `delete(id)` — remove a single record
    - `reorderInTransaction(updates)` — batch update order fields in a transaction

- [x] **Task 7 — Storage service**
  - Create `services/storage.service.ts` with:
    - `generatePresignedUploadUrl({ petId, fileName, contentType, fileSize })` — generates the presigned PUT URL and returns `{ url, s3Key }`.
    - `deleteS3Object(s3Key)` — deletes an object from S3.
  - S3 key format: `pets/{petId}/{Date.now()}-{sanitizedFileName}`.
  - Presigned URL expires in 300 seconds.
  - Includes `Content-Type` and `Content-Length` conditions in the presigned URL.

- [x] **Task 8 — Image service**
  - Create `services/image.service.ts` with:
    - `confirmImageUpload(params)` — validates ownership, checks limit, creates record.
    - `deleteImage(imageId, petId, ownerId)` — validates ownership, deletes from S3 + DB, reorders remaining.
    - `reorderImages(petId, imageIds, ownerId)` — validates ownership, validates imageIds match existing, updates in transaction.
    - `getImagesForPet(petId)` — returns ordered images.

- [x] **Task 9 — API: Presigned URL route**
  - Create `app/api/uploads/presigned-url/route.ts` — `POST` handler.
  - Auth → validate body → ownership check → limit check → generate presigned URL → return.
  - Uses standard `ApiResponse<PresignedUrlResponse>` envelope.

- [x] **Task 10 — API: Confirm upload route**
  - Create `app/api/uploads/confirm/route.ts` — `POST` handler.
  - Auth → validate body → ownership check → create PetImage record → return `201`.
  - Uses standard `ApiResponse<PetImageType>` envelope.

- [x] **Task 11 — API: Delete image route**
  - Create `app/api/pets/[id]/images/[imageId]/route.ts` — `DELETE` handler.
  - Auth → ownership check → delete S3 object → delete record → reorder → return `200`.
  - Uses standard `ApiResponse<null>` envelope.

- [x] **Task 12 — API: Reorder images route**
  - Create `app/api/pets/[id]/images/reorder/route.ts` — `PATCH` handler.
  - Auth → ownership check → validate image IDs → update in transaction → return updated list.
  - Uses standard `ApiResponse<PetImageType[]>` envelope.

- [x] **Task 13 — PetPhotoUploader component**
  - Create `components/pets/PetPhotoUploader.tsx` as a Client Component.
  - Features:
    - File input + drag-and-drop zone.
    - Client-side validation (type + size) before API call.
    - Upload progress display.
    - After upload: auto-refresh image list.
    - Display current images with delete button on each.
    - Show "Maximum 6 images" message when limit reached.
  - Uses `XMLHttpRequest` (not `fetch`) for upload progress tracking.

- [x] **Task 14 — PetImageGallery component**
  - Create `components/pets/PetImageGallery.tsx` as a Server Component.
  - Displays images in a primary + grid layout:
    - Order 0: large hero image.
    - Order 1+: responsive grid below.
  - Uses `next/image` with `width`, `height`, and `alt`.
  - Empty state: "No photos uploaded yet."

- [x] **Task 15 — Pet Detail page integration**
  - Update `app/(main)/pets/[id]/page.tsx`:
    - Fetch images via `getImagesForPet(pet.id)` from the image service.
    - Pass images to `<PetImageGallery>` for display.
    - Render `<PetPhotoUploader>` below the gallery for management.
  - Update `components/pets/PetDetailView.tsx` if needed to accommodate photos section.

- [x] **Task 16 — Environment variables validation**
  - Update `lib/env.ts` to add validation for:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `AWS_S3_BUCKET_NAME`
  - Update `.env.example` if any new variables are needed.

- [x] **Task 17 — Build verification**
  - Run `npx prisma validate` — schema is valid.
  - Run `npx tsc --noEmit` — zero TypeScript errors.
  - Run `npm run build` — successful production build.
  - Manually test:
    1. Upload a JPEG image to a pet.
    2. Verify the image appears on the detail page.
    3. Upload until limit (6) — verify error message.
    4. Delete an image — verify it's removed from page and S3.
    5. Reorder images — verify new order persists after reload.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] Presigned URL generation works end-to-end (API → S3 → confirm).
- [ ] File type validation rejects non-image files (client + server).
- [ ] File size validation rejects files > 5 MB (client + server).
- [ ] Maximum 6 images per pet is enforced.
- [ ] Delete removes both S3 object and database record.
- [ ] Reorder persists new ordering atomically.
- [ ] Primary image (order 0) is displayed prominently.
- [ ] Upload progress is visible to the user.
- [ ] Ownership is verified on every API operation.
- [ ] No raw `<img>` tags — all images use `next/image`.
- [ ] All API responses use the standard envelope type.
- [ ] No TypeScript `any` types introduced.
- [ ] Build passes with zero errors.
