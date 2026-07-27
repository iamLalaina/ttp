# Requirements — Photo Upload

## Overview

This specification covers pet photo upload and management. Rescuers can upload multiple photos per pet, reorder them to set a primary image, and delete unwanted photos. Files are stored in Amazon S3 via presigned URLs — the client uploads directly to S3 without passing through the Next.js server.

**Out of scope for this spec:**
- Image cropping or editing in the browser
- AI-based image analysis or auto-tagging
- Public-facing photo gallery in the catalog (separate spec)
- CloudFront CDN distribution (production optimization — future)
- Photo compression/resizing (client-side before upload is optional; server-side not in MVP)

---

## Functional Requirements

### FR-01 — Upload Flow
The system must implement a presigned URL flow:
1. Client requests a presigned upload URL from the API.
2. API generates a time-limited S3 presigned PUT URL.
3. Client uploads the file directly to S3 using the presigned URL.
4. After successful upload, client notifies the API to persist the image record.

### FR-02 — File Validation (Client-Side)
Before requesting a presigned URL, the client must validate:
- File type: only `image/jpeg`, `image/png`, `image/webp` accepted.
- File size: maximum 5 MB per image.
- Display a clear error if validation fails.

### FR-03 — File Validation (Server-Side)
The API must independently validate the requested file metadata:
- `contentType` must be one of `image/jpeg`, `image/png`, `image/webp`.
- `fileSize` must not exceed 5 MB (5,242,880 bytes).
- `fileName` must be a non-empty string.
- Reject with `400 VALIDATION_ERROR` if any check fails.

### FR-04 — Image Limit Per Pet
Each pet can have a maximum of 6 photos. The API must reject upload requests if the pet already has 6 images.

### FR-05 — Image Ordering
Each image has a numeric `order` field (0-based). The first uploaded image gets order `0` (primary). The rescuer can reorder images by drag-and-drop or explicit action.

### FR-06 — Primary Image
The image with `order: 0` is the primary (cover) image displayed in cards, search results, and the detail page header. There must always be exactly one image at position 0 if images exist.

### FR-07 — Delete Photo
The rescuer can delete any photo. Deletion must:
- Remove the S3 object.
- Remove the database record.
- Reorder remaining images to fill the gap (maintain contiguous 0-based ordering).

### FR-08 — Reorder Photos
The rescuer can change the order of existing photos. The API must accept a new ordering and update all affected `order` values in a single transaction.

### FR-09 — Ownership Verification
All photo operations (upload, delete, reorder) must verify the authenticated user owns the pet. Return `404` if not.

### FR-10 — Access Control
All API routes require authentication. Return `401 UNAUTHORIZED` if not authenticated.

### FR-11 — Integration with Pet Detail
The Pet Detail page must display all uploaded photos for the pet. The primary image (order 0) should be prominently shown, with remaining images in a smaller gallery grid.

### FR-12 — Upload Progress
The client must display upload progress feedback (percentage or indeterminate spinner) during the S3 PUT operation.

### FR-13 — S3 Key Pattern
Image keys in S3 must follow the pattern: `pets/{petId}/{timestamp}-{sanitizedFileName}` — as specified in the steering files.

---

## User Stories

### US-01 — Upload pet photos
> **As a** rescuer,  
> **I want to** upload photos of my pet,  
> **so that** potential adopters can see what the pet looks like.

### US-02 — Set primary photo
> **As a** rescuer,  
> **I want to** choose which photo appears first,  
> **so that** the best photo is shown in the catalog card and search results.

### US-03 — Remove a bad photo
> **As a** rescuer,  
> **I want to** delete a photo that doesn't look good,  
> **so that** only quality images represent my pet.

### US-04 — Reorder photos
> **As a** rescuer,  
> **I want to** rearrange my pet's photos,  
> **so that** I can control the visual presentation order.

### US-05 — See validation errors
> **As a** rescuer,  
> **I want to** see clear feedback if my file is too large or wrong format,  
> **so that** I know what to fix without guessing.

---

## Acceptance Criteria

### AC-01 — Presigned URL generation
- **Given** an authenticated user who owns a pet,
- **When** they request a presigned URL with valid metadata (filename, content type, size),
- **Then** the API returns a presigned PUT URL and the S3 key where the file will be stored.

### AC-02 — Direct S3 upload
- **Given** a valid presigned URL,
- **When** the client uploads a file within the expiry window,
- **Then** the file is stored in S3 at the specified key.

### AC-03 — Image record creation
- **Given** a successful S3 upload,
- **When** the client confirms the upload to the API,
- **Then** a `PetImage` record is created with the correct `petId`, `s3Key`, `url`, `order`, and metadata.

### AC-04 — File type rejection
- **Given** a file with type `application/pdf`,
- **When** the presigned URL is requested,
- **Then** the API returns `400 VALIDATION_ERROR` with message "File type not supported".

### AC-05 — File size rejection
- **Given** a file larger than 5 MB,
- **When** the presigned URL is requested,
- **Then** the API returns `400 VALIDATION_ERROR` with message "File exceeds maximum size of 5 MB".

### AC-06 — Image limit enforced
- **Given** a pet already has 6 images,
- **When** the user tries to upload a 7th,
- **Then** the API returns `400 VALIDATION_ERROR` with message "Maximum of 6 images per pet".

### AC-07 — Delete removes from S3 and database
- **Given** a pet has an image at order 2,
- **When** the user deletes it,
- **Then** the S3 object is removed, the database record is deleted, and remaining images are reordered.

### AC-08 — Reorder updates all positions
- **Given** a pet has 4 images (0, 1, 2, 3),
- **When** the user moves image 3 to position 1,
- **Then** the new order is [0, 3, 1, 2] and all `order` values are updated.

### AC-09 — Ownership blocks cross-user access
- **Given** user A tries to upload a photo to user B's pet,
- **When** the API processes the request,
- **Then** it returns `404` (not `403`, to avoid leaking existence).

### AC-10 — Photos displayed on detail page
- **Given** a pet has 3 uploaded photos,
- **When** the owner views `/pets/[id]`,
- **Then** the primary image is large and the other 2 appear in a gallery grid below.
