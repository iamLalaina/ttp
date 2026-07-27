# Technical Design — Dashboard Pet Listing

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/pet-detail/design.md]]
- #[[file:.kiro/specs/photo-upload/design.md]]

---

## Architecture Overview

The dashboard pet listing follows the same server-rendered architecture:

```
Dashboard Page (Server Component)
  └── getPetsForOwner(ownerId) — services/pet.service.ts
        └── petRepository.findByOwnerWithPrimaryImage(ownerId) — repositories/pet.repository.ts
              └── prisma.pet.findMany({ include: { images } }) — PostgreSQL via Prisma
```

All data fetching happens server-side. The page is a Server Component that renders the card grid or empty state based on the query result.

---

## Data Flow

1. Dashboard page calls `getCurrentUserFromCookies()` for auth.
2. Calls `getPetsForOwner(ownerId)` from the service layer.
3. Service delegates to `petRepository.findByOwnerWithPrimaryImage(ownerId)`.
4. Repository uses Prisma `findMany` with a filtered `include` to load only the primary image (order 0) per pet.
5. Returns `PetWithPrimaryImage[]` — the pet record plus an optional primary image URL.
6. Page renders `<PetCardGrid>` or `<EmptyState>`.

---

## Types

### `types/pet.types.ts` — Extension

```ts
/** Pet record with optional primary image for card display. */
export type PetWithPrimaryImage = PetType & {
  primaryImageUrl: string | null;
};
```

This is a view-model type used only by the dashboard — it enriches `PetType` with the resolved primary image URL.

---

## Repository Layer — Extension

### `repositories/pet.repository.ts` — New method

```ts
/**
 * Finds all pets for a given owner, newest first.
 * Includes only the primary image (order 0) for each pet.
 */
async findByOwnerWithPrimaryImage(ownerId: string): Promise<(Pet & { images: PetImage[] })[]> {
  return prisma.pet.findMany({
    where: { ownerId },
    include: {
      images: {
        where: { order: 0 },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

**Design decision:** Using Prisma `include` with a `where` filter on images avoids N+1 queries. Only the primary image is loaded — not all images per pet.

---

## Service Layer — Extension

### `services/pet.service.ts` — New function

```ts
/**
 * Returns all pets for the given owner, each enriched with its primary image URL.
 * Ordered by creation date descending (newest first).
 */
export async function getPetsForOwner(ownerId: string): Promise<PetWithPrimaryImage[]> {
  const pets = await petRepository.findByOwnerWithPrimaryImage(ownerId);
  
  return pets.map((pet) => ({
    ...pet,
    primaryImageUrl: pet.images[0]?.url ?? null,
  })) as PetWithPrimaryImage[];
}
```

---

## Component Breakdown

### `components/pets/PetCard.tsx`

**Type:** Server Component

**Props:**
```ts
interface PetCardProps {
  pet: PetWithPrimaryImage;
}
```

**Structure:**
- Aspect-ratio image container (3:2) with primary image or placeholder
- Card body: name, status badge, species + breed, location, date
- Card footer: View and Edit links
- Uses `next/image` for the pet photo
- Status badge reuses the same color mapping from PetDetailView

---

### `components/pets/PetCardGrid.tsx`

**Type:** Server Component

**Props:**
```ts
interface PetCardGridProps {
  pets: PetWithPrimaryImage[];
}
```

**Structure:**
- Responsive CSS Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Maps over `pets` and renders `<PetCard>` for each
- Heading: "Your pets (N)"

---

### `components/pets/PetEmptyState.tsx`

**Type:** Server Component

**Structure:**
- Centered layout with an icon (e.g., Lucide `PawPrint` or `Dog`)
- Heading: "You haven't registered any pets yet."
- Subtext: "Start by registering your first pet."
- CTA button: "Register your first pet" → `/pets/new`

---

## Dashboard Page Update

### `app/(main)/dashboard/page.tsx`

Convert to an async Server Component that:
1. Calls `getCurrentUserFromCookies()`.
2. Calls `getPetsForOwner(user.id)`.
3. Renders Quick Actions section (preserved from current implementation).
4. Renders `<PetCardGrid>` if pets exist, or `<PetEmptyState>` if empty.

---

## Loading State

### `app/(main)/dashboard/loading.tsx`

Skeleton cards matching the grid layout:
- 6 skeleton cards (2 rows × 3 columns on desktop)
- Each skeleton: image placeholder + 4 text lines + 2 action placeholders
- Uses `animate-pulse` + `bg-muted`

---

## Error State

### `app/(main)/dashboard/error.tsx`

Client Component (`"use client"`) with:
- "Something went wrong" heading
- "We couldn't load your pets. Please try again."
- "Try again" button calling `reset()`

---

## Placeholder Image

When a pet has no images, the card shows a static placeholder. Options:
- A neutral SVG illustration of a pet silhouette stored in `/public/images/pet-placeholder.svg`
- Or a Tailwind-styled div with a Lucide icon (`PawPrint`) centered

**Decision:** Use a Tailwind-styled div with `PawPrint` icon — avoids an extra static asset and works in all themes (light/dark). The placeholder has a `bg-muted` background.

---

## File Map

```
types/
  pet.types.ts                          ← Add PetWithPrimaryImage type

repositories/
  pet.repository.ts                     ← Add findByOwnerWithPrimaryImage()

services/
  pet.service.ts                        ← Add getPetsForOwner()

components/
  pets/
    PetCard.tsx                          ← New (Server Component)
    PetCardGrid.tsx                      ← New (Server Component)
    PetEmptyState.tsx                    ← New (Server Component)

app/
  (main)/
    dashboard/
      page.tsx                          ← Replace placeholder with real listing
      loading.tsx                       ← New skeleton
      error.tsx                         ← New error boundary
```

---

## Performance Considerations

- **Single query:** The repository method uses one `findMany` with `include` — no N+1.
- **Server Component:** No JavaScript shipped for the card grid; only the HTML is sent.
- **Image optimization:** `next/image` with `sizes` prop for responsive image loading.
- **No pagination:** Acceptable for MVP (target ≤50 pets per user). For scale, add cursor-based pagination in a future spec.
