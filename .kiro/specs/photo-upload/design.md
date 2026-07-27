# Technical Design — Photo Upload

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/pet-detail/design.md]]

---

## Architecture Overview

The photo upload feature introduces a two-phase client-to-S3 flow:

```
Client                    API                         S3
  │                        │                          │
  │─── POST /presigned ───►│                          │
  │                        │── generate presigned ──► │
  │◄── { url, key } ──────│                          │
  │                        │                          │
  │──────── PUT file ─────────────────────────────────►│
  │◄─────── 200 OK ──────────────────────────────────│
  │                        │                          │
  │── POST /confirm ──────►│                          │
  │                        │── create PetImage record │
  │◄── { image } ─────────│                          │
```

The Next.js server never handles the raw file bytes — it only generates presigned URLs and manages metadata records.

---

## Data Model

### Prisma Schema — `PetImage`

```prisma
model PetImage {
  id          String   @id @default(cuid())
  petId       String
  pet         Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  s3Key       String   @unique
  url         String
  fileName    String
  contentType String
  fileSize    Int
  order       Int
  createdAt   DateTime @default(now())

  @@index([petId])
  @@unique([petId, order])
}
```

Update the `Pet` model to add the relation:

```prisma
model Pet {
  // ... existing fields ...
  images  PetImage[]
}
```

**Design decisions:**
- `s3Key` is unique — prevents duplicate records for the same S3 object.
- `@@unique([petId, order])` enforces that no two images for the same pet can share an order position.
- `onDelete: Cascade` ensures images are cleaned up when a pet is deleted.
- `url` stores the full accessible URL (presigned GET or CloudFront URL).
- `fileSize` stored as `Int` (bytes) — useful for analytics and quota enforcement.

---

## Constants

```ts
// lib/constants.ts (or inline in schemas)
export const MAX_IMAGE_SIZE_BYTES = 5_242_880; // 5 MB
export const MAX_IMAGES_PER_PET = 6;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes
```

---

## Zod Validation Schemas

### `schemas/upload.schema.ts`

```ts
// Request body for presigned URL generation
export const presignedUrlRequestSchema = z.object({
  petId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSize: z.number().int().positive().max(5_242_880),
});

// Request body for confirming upload
export const confirmUploadSchema = z.object({
  petId: z.string().min(1),
  s3Key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSize: z.number().int().positive().max(5_242_880),
});

// Request body for reordering
export const reorderImagesSchema = z.object({
  petId: z.string().min(1),
  imageIds: z.array(z.string().min(1)).min(1).max(6),
});
```

---

## API Routes

### `POST /api/uploads/presigned-url`

**File:** `app/api/uploads/presigned-url/route.ts`

**Request body:** `presignedUrlRequestSchema`

**Flow:**
1. Authenticate user.
2. Validate body.
3. Verify user owns the pet.
4. Check image count < 6 for this pet.
5. Generate S3 key: `pets/{petId}/{Date.now()}-{sanitizedFileName}`.
6. Create presigned PUT URL using `@aws-sdk/s3-request-presigner`.
7. Return `{ data: { url: string, s3Key: string }, error: null }`.

**Error responses:**
| Scenario | Status | Code |
|---|---|---|
| Not authenticated | 401 | `UNAUTHORIZED` |
| Validation failure | 400 | `VALIDATION_ERROR` |
| Pet not owned / not found | 404 | `NOT_FOUND` |
| Image limit reached | 400 | `VALIDATION_ERROR` |
| S3 error | 500 | `INTERNAL_ERROR` |

---

### `POST /api/uploads/confirm`

**File:** `app/api/uploads/confirm/route.ts`

**Request body:** `confirmUploadSchema`

**Flow:**
1. Authenticate user.
2. Validate body.
3. Verify user owns the pet.
4. Determine next order value: `count of existing images for this pet`.
5. Create `PetImage` record with s3Key, url, fileName, contentType, fileSize, order.
6. Return `{ data: PetImageType, error: null }` with status `201`.

**URL generation:** For MVP, the `url` field stores a presigned GET URL (regenerated on access) or the direct S3 URL if the bucket is public via CloudFront. Initially: `https://{bucket}.s3.{region}.amazonaws.com/{s3Key}`.

---

### `DELETE /api/pets/[id]/images/[imageId]`

**File:** `app/api/pets/[id]/images/[imageId]/route.ts`

**Flow:**
1. Authenticate user.
2. Verify user owns the pet.
3. Find the `PetImage` record.
4. Delete the S3 object using `DeleteObjectCommand`.
5. Delete the database record.
6. Reorder remaining images to fill the gap.
7. Return `{ data: null, error: null }` with status `200`.

---

### `PATCH /api/pets/[id]/images/reorder`

**File:** `app/api/pets/[id]/images/reorder/route.ts`

**Request body:** `reorderImagesSchema`

**Flow:**
1. Authenticate user.
2. Verify user owns the pet.
3. Validate that `imageIds` contains exactly all current image IDs for this pet (no additions, no removals).
4. Update each image's `order` field in a Prisma transaction based on the array index.
5. Return `{ data: PetImageType[], error: null }` with updated records.

---

## S3 Client Singleton

### `lib/s3.ts`

```ts
import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as { s3: S3Client | undefined };

export const s3 = globalForS3.s3 ?? new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3;
}
```

---

## Service Layer

### `services/storage.service.ts`

```ts
function generatePresignedUploadUrl(params: {
  petId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<{ url: string; s3Key: string }>

function deleteS3Object(s3Key: string): Promise<void>
```

### `services/image.service.ts`

```ts
function confirmImageUpload(params: {
  petId: string;
  s3Key: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  ownerId: string;
}): Promise<PetImageType>

function deleteImage(imageId: string, petId: string, ownerId: string): Promise<void>

function reorderImages(petId: string, imageIds: string[], ownerId: string): Promise<PetImageType[]>

function getImagesForPet(petId: string): Promise<PetImageType[]>
```

---

## Repository Layer

### `repositories/image.repository.ts`

```ts
export const imageRepository = {
  async create(data: CreatePetImageInput): Promise<PetImage>
  async findByPetId(petId: string): Promise<PetImage[]>
  async findById(id: string): Promise<PetImage | null>
  async countByPetId(petId: string): Promise<number>
  async delete(id: string): Promise<void>
  async updateOrder(id: string, order: number): Promise<PetImage>
  async reorderInTransaction(updates: { id: string; order: number }[]): Promise<void>
}
```

---

## TypeScript Types

### `types/image.types.ts`

```ts
export type CreatePetImageInput = {
  petId: string;
  s3Key: string;
  url: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  order: number;
};

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

export type PresignedUrlResponse = {
  url: string;
  s3Key: string;
};
```

---

## Client Component — PetPhotoUploader

### `components/pets/PetPhotoUploader.tsx`

**Type:** Client Component (`"use client"`)

**Features:**
- Drag-and-drop zone + file input button.
- Validates file type and size before requesting presigned URL.
- Shows upload progress (using `XMLHttpRequest` with `onprogress` for percentage tracking).
- After successful upload, calls confirm endpoint and refreshes the image list.
- Displays current images in a grid with reorder (drag) and delete (button) actions.
- Limits to 6 images maximum with clear feedback when limit reached.

**Integration:**
- Rendered on the Pet Detail page below the pet info.
- Also available on a standalone upload page at `/pets/[id]/photos` (optional, future).

---

## Client Component — PetImageGallery

### `components/pets/PetImageGallery.tsx`

**Type:** Server Component for the read-only display on the detail page.

**Features:**
- Primary image (order 0) displayed large.
- Remaining images in a responsive grid (2–3 columns).
- Uses `next/image` with proper `width`, `height`, and `alt` attributes.
- Graceful empty state: "No photos uploaded yet" with CTA to upload.

---

## Environment Variables Required

```
AWS_REGION                # S3 bucket region
AWS_ACCESS_KEY_ID         # IAM credentials for S3
AWS_SECRET_ACCESS_KEY     # IAM credentials for S3
AWS_S3_BUCKET_NAME        # Target bucket name
```

These are already listed in `.env.example` (added during pet-registration spec).

---

## File Map

```
prisma/
  schema.prisma                             ← Add PetImage model + Pet relation

app/
  api/
    uploads/
      presigned-url/
        route.ts                            ← POST — generate presigned URL
      confirm/
        route.ts                            ← POST — create PetImage record
    pets/
      [id]/
        images/
          [imageId]/
            route.ts                        ← DELETE — remove image
          reorder/
            route.ts                        ← PATCH — reorder images

components/
  pets/
    PetPhotoUploader.tsx                    ← Client Component (upload + manage)
    PetImageGallery.tsx                     ← Server Component (read-only display)

services/
  storage.service.ts                        ← S3 presigned URL + delete
  image.service.ts                          ← Image business logic

repositories/
  image.repository.ts                       ← PetImage Prisma calls

schemas/
  upload.schema.ts                          ← Zod schemas for upload/confirm/reorder

types/
  image.types.ts                            ← TypeScript types

lib/
  s3.ts                                     ← S3Client singleton
```

---

## Security Considerations

- **Presigned URLs expire in 5 minutes** — limits the window for misuse.
- **Content-Type is enforced in the presigned URL conditions** — the PUT must match the declared type.
- **File size is enforced client-side and server-side** — the presigned URL also includes a content-length condition.
- **S3 bucket is private** — no public read. Access is via presigned GET URLs or CloudFront (future).
- **Ownership verified at every step** — presigned URL generation, confirmation, deletion, and reorder all check that the user owns the pet.
- **S3 key includes petId** — prevents cross-pet file reference attacks.
