# Technical Design — Public Pet Catalog

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/dashboard-pets/design.md]]
- #[[file:.kiro/specs/photo-upload/design.md]]

---

## Architecture Overview

The public catalog follows the same server-rendered architecture, but uses dedicated "public" queries that filter by status and never expose owner data.

```
Catalog Page (Server Component)
  └── getPublishedPets() — services/catalog.service.ts
        └── petRepository.findPublishedWithPrimaryImage() — repositories/pet.repository.ts
              └── prisma.pet.findMany({ where: { status: "published" } })

Detail Page (Server Component)
  └── getPublishedPetById(id) — services/catalog.service.ts
        └── petRepository.findPublishedById(id) — repositories/pet.repository.ts
              └── prisma.pet.findUnique({ where: { id, status: "published" } })
```

**Key difference from owner queries:** These never accept `ownerId` and always include a `status: "published"` filter. A draft or adopted pet is invisible regardless of any URL manipulation.

---

## Route Structure

The catalog lives in the `(public)` route group as specified in the steering files:

```
app/
  (public)/
    catalog/
      page.tsx              ← Catalog listing
      loading.tsx           ← Skeleton grid
      error.tsx             ← Error boundary
      [id]/
        page.tsx            ← Public detail
        loading.tsx         ← Skeleton detail
        not-found.tsx       ← 404 state
        error.tsx           ← Error boundary
```

The `(public)` route group uses a minimal layout (no authenticated nav). A `layout.tsx` inside `(public)` provides the public chrome.

---

## Repository Layer — Extensions

### `repositories/pet.repository.ts` — New methods

```ts
/**
 * Finds all published pets with their primary image.
 * Ordered by updatedAt descending (proxy for "most recently published").
 */
async findPublishedWithPrimaryImage(): Promise<(Pet & { images: PetImage[] })[]> {
  return prisma.pet.findMany({
    where: { status: "published" },
    include: {
      images: { where: { order: 0 }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Finds a single published pet by ID.
 * Returns null if the pet doesn't exist or isn't published.
 */
async findPublishedById(id: string): Promise<Pet | null> {
  return prisma.pet.findFirst({
    where: { id, status: "published" },
  });
}
```

**Design decision:** `findPublishedById` uses `findFirst` with both `id` and `status` in the `where` clause. This returns `null` for drafts — the caller cannot distinguish "not found" from "not published," which is intentional (no information leak).

---

## Service Layer — New File

### `services/catalog.service.ts`

```ts
/**
 * Public catalog service.
 *
 * Contains queries for the public-facing catalog pages.
 * Never exposes ownerId or management operations.
 */

async function getPublishedPets(): Promise<PublicPetCard[]>
async function getPublishedPetById(id: string): Promise<PublicPetDetail | null>
```

---

## TypeScript Types

### `types/pet.types.ts` — Extensions

```ts
/** Subset of pet fields safe for public display on catalog cards. */
export type PublicPetCard = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  ageInMonths: number;
  sex: "male" | "female";
  size: "small" | "medium" | "large";
  city: string;
  state: string;
  primaryImageUrl: string | null;
};

/** Full public pet detail — all fields safe for adopters to see. */
export type PublicPetDetail = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  ageInMonths: number;
  sex: "male" | "female";
  size: "small" | "medium" | "large";
  healthStatus: string;
  vaccinationStatus: "up_to_date" | "partial" | "unknown";
  sterilized: "yes" | "no" | "unknown";
  friendlyWithChildren: "yes" | "no" | "unknown";
  friendlyWithAnimals: "yes" | "no" | "unknown";
  description: string;
  city: string;
  state: string;
  createdAt: Date;
};
```

**Security:** These types explicitly exclude `ownerId`, `status`, and `updatedAt`. The component layer cannot accidentally render private data because it's not in the type.

---

## Component Structure

### Reused Components (no changes needed)
- `PetImageGallery` — read-only photo gallery (its intended home)
- `PetStatusBadge` — not used on public pages (status is always "published")
- Utility functions: `formatAge`, `formatDate`, `capitalize`, `formatEnumLabel`

### New Components

#### `components/catalog/CatalogPetCard.tsx`
- Server Component
- Props: `{ pet: PublicPetCard }`
- Similar to `PetCard` but:
  - No status badge (all are published)
  - No "Edit" link
  - "View details" link instead of "View" / "Edit"
  - Shows formatted age
- Uses `next/image` with `fill` + `sizes`

#### `components/catalog/CatalogGrid.tsx`
- Server Component
- Props: `{ pets: PublicPetCard[] }`
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Maps over pets and renders `<CatalogPetCard>`

#### `components/catalog/CatalogEmptyState.tsx`
- Server Component
- "No pets available for adoption right now. Check back soon!"
- Friendly illustration (PawPrint icon)

#### `components/catalog/PublicPetDetailView.tsx`
- Server Component
- Props: `{ pet: PublicPetDetail }`
- Similar structure to `PetDetailView` but:
  - No Edit link
  - No `ownerId` display
  - No status badge
  - Includes all public fields from FR-06

---

## Public Layout

### `app/(public)/layout.tsx`

Minimal public layout with:
- Simple header: logo + "Browse Catalog" + login link
- No authenticated nav items
- Same max-width and padding as the main layout for visual consistency

---

## Image Handling

The `PetImageGallery` component is used as-is on the public detail page. Images are fetched via `getImagesForPet(petId)` from the existing image service — this function has no ownership check, which is correct for public pages where the pet is already confirmed as published.

---

## File Map

```
types/
  pet.types.ts                              ← Add PublicPetCard, PublicPetDetail

repositories/
  pet.repository.ts                         ← Add findPublishedWithPrimaryImage(), findPublishedById()

services/
  catalog.service.ts                        ← New file

components/
  catalog/
    CatalogPetCard.tsx                      ← New
    CatalogGrid.tsx                         ← New
    CatalogEmptyState.tsx                   ← New
    PublicPetDetailView.tsx                  ← New

app/
  (public)/
    layout.tsx                              ← New (public chrome)
    catalog/
      page.tsx                              ← Catalog listing
      loading.tsx                           ← Skeleton
      error.tsx                             ← Error boundary
      [id]/
        page.tsx                            ← Public detail
        loading.tsx                         ← Skeleton
        not-found.tsx                       ← 404
        error.tsx                           ← Error boundary
```

---

## Performance

- **Single query per page:** `findPublishedWithPrimaryImage` includes primary images in one query (no N+1).
- **Server Components:** No JavaScript shipped for the card grid — only HTML.
- **`next/image`:** Uses `sizes` prop on all images for responsive optimization.
- **No auth overhead:** Public pages skip token verification entirely.

---

## Middleware Configuration

The existing `middleware.ts` already excludes `/catalog` from protection via the matcher regex. No changes needed.
