# Technical Design — Rescuer Profile

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/public-pet-catalog/design.md]]
- #[[file:.kiro/specs/dashboard-pets/design.md]]

---

## Architecture Overview

```
Private (auth required):
  /profile → RescuerProfileForm (Client Component)
    └── PUT /api/profile (Route Handler — upsert)
          └── upsertProfile() — services/profile.service.ts
                └── profileRepository.upsert()

Public (no auth):
  /rescuers/[id] → PublicRescuerProfile (Server Component)
    └── getPublicProfile(id) — services/profile.service.ts
          └── profileRepository.findById()
    └── getPublishedPetsByOwner(ownerId) — services/catalog.service.ts
          └── petRepository.findPublishedByOwnerWithPrimaryImage()
```

---

## Data Model

### Prisma Schema — `RescuerProfile`

```prisma
model RescuerProfile {
  id          String   @id @default(cuid())
  ownerId     String   @unique
  displayName String
  bio         String
  city        String
  state       String
  phone       String?
  websiteUrl  String?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([ownerId])
}
```

**Design decisions:**
- `ownerId` is `@unique` — one profile per user (Cognito sub).
- `id` is the public-facing identifier used in `/rescuers/[id]` URLs. The `ownerId` (Cognito sub) is never exposed in URLs.
- Optional fields (`phone`, `websiteUrl`, `imageUrl`) are nullable.
- No relation to `Pet` in the schema — the link is through `ownerId` matching `Pet.ownerId`. This avoids schema coupling.

---

## TypeScript Types

### `types/profile.types.ts`

```ts
export type CreateOrUpdateProfileInput = {
  displayName: string;
  bio: string;
  city: string;
  state: string;
  phone?: string;
  websiteUrl?: string;
  imageUrl?: string;
};

export type RescuerProfileType = {
  id: string;
  ownerId: string;
  displayName: string;
  bio: string;
  city: string;
  state: string;
  phone: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Public-safe subset — excludes ownerId. */
export type PublicRescuerProfile = {
  id: string;
  displayName: string;
  bio: string;
  city: string;
  state: string;
  phone: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
};
```

---

## Zod Schema

### `schemas/profile.schema.ts`

```ts
export const profileSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().min(10).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  websiteUrl: z.string().url().max(255).optional().or(z.literal("")),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
});
```

The `.or(z.literal(""))` pattern allows empty strings from the form to pass (they're treated as "not provided" at the service layer).

---

## Repository Layer

### `repositories/profile.repository.ts`

```ts
export const profileRepository = {
  async findByOwnerId(ownerId: string): Promise<RescuerProfile | null>
  async findById(id: string): Promise<RescuerProfile | null>
  async upsert(ownerId: string, data: CreateOrUpdateProfileInput): Promise<RescuerProfile>
}
```

The `upsert` uses Prisma's native `upsert`:
```ts
prisma.rescuerProfile.upsert({
  where: { ownerId },
  create: { ownerId, ...data },
  update: data,
})
```

---

## Service Layer

### `services/profile.service.ts`

```ts
async function upsertProfile(ownerId: string, input: CreateOrUpdateProfileInput): Promise<RescuerProfileType>
async function getProfileForOwner(ownerId: string): Promise<RescuerProfileType | null>
async function getPublicProfile(profileId: string): Promise<PublicRescuerProfile | null>
async function getProfileByOwnerId(ownerId: string): Promise<PublicRescuerProfile | null>
  // Used by public pet detail to link to rescuer profile
```

---

## Repository Extension for Catalog

### `repositories/pet.repository.ts` — New method

```ts
async findPublishedByOwnerWithPrimaryImage(ownerId: string): Promise<(Pet & { images: PetImage[] })[]>
  // WHERE ownerId = X AND status = "published", include primary image
```

### `services/catalog.service.ts` — New function

```ts
async function getPublishedPetsByOwner(ownerId: string): Promise<PublicPetCard[]>
```

---

## API Route

### `PUT /api/profile`

**Auth required.** Upsert pattern — creates if not exists, updates if exists.

- Validate body with `profileSchema`.
- Call `upsertProfile(user.id, data)`.
- Return 200 with `ApiResponse<RescuerProfileType>`.

---

## Component Structure

### Private

#### `components/profile/RescuerProfileForm.tsx`
- Client Component (`"use client"`)
- Props: `{ profile: RescuerProfileType | null }`
- Pre-fills if profile exists; empty form for creation
- Submits via `PUT /api/profile`
- Success message shown after save (stays on page)

### Public

#### `components/profile/PublicProfileView.tsx`
- Server Component
- Props: `{ profile: PublicRescuerProfile }`
- Displays: image (or placeholder), display name, bio, city/state, phone, website link

---

## Pages

### `/profile` (private)
- `app/(main)/profile/page.tsx` — async Server Component
- Fetches `getProfileForOwner(user.id)`
- Renders `<RescuerProfileForm profile={profile} />`
- Loading/error states

### `/rescuers/[id]` (public)
- `app/(public)/rescuers/[id]/page.tsx` — async Server Component
- Fetches profile + published pets for the profile's owner
- Renders `<PublicProfileView>` + `<CatalogGrid>`
- Loading/not-found/error states

### Public pet detail integration
- Update `/catalog/[id]` to show "View rescuer profile" link if a profile exists for the pet's owner.
- Requires `getProfileByOwnerId(pet.ownerId)` — but pet.ownerId isn't in `PublicPetDetail`... 
- **Solution:** Add a `rescuerProfileId` to the catalog service's response when a profile exists. This avoids exposing ownerId while providing the link target.

---

## File Map

```
prisma/
  schema.prisma                             ← Add RescuerProfile model

types/
  profile.types.ts                          ← New

schemas/
  profile.schema.ts                         ← New

repositories/
  profile.repository.ts                     ← New
  pet.repository.ts                         ← Add findPublishedByOwnerWithPrimaryImage()

services/
  profile.service.ts                        ← New
  catalog.service.ts                        ← Add getPublishedPetsByOwner()

app/
  api/
    profile/
      route.ts                              ← PUT (auth, upsert)
  (main)/
    profile/
      page.tsx                              ← Private profile management
      loading.tsx
      error.tsx
  (public)/
    rescuers/
      [id]/
        page.tsx                            ← Public rescuer page
        loading.tsx
        not-found.tsx
        error.tsx
    catalog/
      [id]/
        page.tsx                            ← Add rescuer link (update)

components/
  profile/
    RescuerProfileForm.tsx                  ← Client Component
    PublicProfileView.tsx                   ← Server Component

app/(main)/layout.tsx                       ← Add "Profile" nav link
```

---

## Security

- **Public page uses profile `id`** (CUID) in URLs — never `ownerId` (Cognito sub).
- **ownerId is `@unique`** — ensures one profile per user.
- **Public types exclude ownerId** — impossible to accidentally render.
- **Catalog integration:** The pet detail page links to `/rescuers/{profileId}` without exposing who owns the pet internally.
