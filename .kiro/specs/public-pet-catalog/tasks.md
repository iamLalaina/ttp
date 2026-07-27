# Implementation Tasks — Public Pet Catalog

## References
- #[[file:.kiro/specs/public-pet-catalog/requirements.md]]
- #[[file:.kiro/specs/public-pet-catalog/design.md]]

---

## Task Order Rationale

Tasks follow the same bottom-up dependency order:
**types → repository → service → components → pages → states → verification**

---

## Tasks

- [x] **Task 1 — TypeScript types: PublicPetCard and PublicPetDetail**
  - Add `PublicPetCard` and `PublicPetDetail` types to `types/pet.types.ts`.
  - `PublicPetCard`: id, name, species, breed, ageInMonths, sex, size, city, state, primaryImageUrl.
  - `PublicPetDetail`: all fields safe for public display (excludes ownerId, status, updatedAt).
  - Do not modify existing types.

- [x] **Task 2 — Repository: findPublishedWithPrimaryImage**
  - Add `findPublishedWithPrimaryImage()` to `repositories/pet.repository.ts`.
  - Queries `prisma.pet.findMany` with `where: { status: "published" }`.
  - Includes primary image (`images: { where: { order: 0 }, take: 1 }`).
  - Orders by `updatedAt: "desc"`.
  - Do not modify existing methods.

- [x] **Task 3 — Repository: findPublishedById**
  - Add `findPublishedById(id: string)` to `repositories/pet.repository.ts`.
  - Uses `prisma.pet.findFirst({ where: { id, status: "published" } })`.
  - Returns `Pet | null` — null for both non-existent and non-published pets.
  - Do not modify existing methods.

- [x] **Task 4 — Service: catalog.service.ts**
  - Create `services/catalog.service.ts`.
  - `getPublishedPets(): Promise<PublicPetCard[]>` — calls `findPublishedWithPrimaryImage`, maps to `PublicPetCard` (strips ownerId, extracts primary image URL).
  - `getPublishedPetById(id: string): Promise<PublicPetDetail | null>` — calls `findPublishedById`, maps to `PublicPetDetail` (strips ownerId, status, updatedAt).
  - No ownership parameters anywhere — this is a public service.

- [x] **Task 5 — CatalogPetCard component**
  - Create `components/catalog/CatalogPetCard.tsx` as a Server Component.
  - Props: `{ pet: PublicPetCard }`.
  - Displays: primary image or PawPrint placeholder, name, species + breed, formatted age, city/state, "View details" link to `/catalog/[id]`.
  - No status badge (all are published).
  - No Edit link.
  - Uses `next/image` with `fill` + responsive `sizes`.
  - Uses `formatAge`, `capitalize` from `utils/format.ts`.

- [x] **Task 6 — CatalogGrid component**
  - Create `components/catalog/CatalogGrid.tsx` as a Server Component.
  - Props: `{ pets: PublicPetCard[] }`.
  - Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
  - Optional heading: "Pets available for adoption".

- [x] **Task 7 — CatalogEmptyState component**
  - Create `components/catalog/CatalogEmptyState.tsx` as a Server Component.
  - Centered layout with PawPrint icon.
  - Message: "No pets available for adoption right now. Check back soon!"
  - No CTA button (public users can't register pets).

- [x] **Task 8 — PublicPetDetailView component**
  - Create `components/catalog/PublicPetDetailView.tsx` as a Server Component.
  - Props: `{ pet: PublicPetDetail }`.
  - Displays all fields from FR-06 in a structured layout:
    - Name (H1), species + breed, age, sex, size
    - Info grid: vaccination, sterilized, friendly with children, friendly with animals, location
    - Health status section
    - Description section
    - Registration date
  - No Edit link, no management controls.
  - Reuses `formatAge`, `formatDate`, `capitalize`, `formatEnumLabel`.

- [x] **Task 9 — Public layout**
  - Create `app/(public)/layout.tsx`.
  - Minimal header: logo link, "Catalog" nav link, "Login" link.
  - Same `max-w-5xl` container as the main layout.
  - No authenticated nav items.

- [x] **Task 10 — Catalog page**
  - Create `app/(public)/catalog/page.tsx` as a Server Component.
  - Calls `getPublishedPets()`.
  - Renders `<CatalogGrid>` if pets exist, otherwise `<CatalogEmptyState>`.
  - Exports `metadata: { title: "Adopt a Pet — TTP" }`.

- [x] **Task 11 — Catalog loading state**
  - Create `app/(public)/catalog/loading.tsx`.
  - Skeleton cards (6) matching the CatalogGrid layout.
  - Uses `animate-pulse` + `bg-muted`.

- [x] **Task 12 — Catalog error state**
  - Create `app/(public)/catalog/error.tsx` as a Client Component.
  - "Something went wrong" + "Try again" button.

- [x] **Task 13 — Public pet detail page**
  - Create `app/(public)/catalog/[id]/page.tsx` as an async Server Component.
  - Calls `getPublishedPetById(id)`.
  - If null → `notFound()`.
  - Fetches images via `getImagesForPet(id)`.
  - Renders `<PetImageGallery>` + `<PublicPetDetailView>`.
  - Implements `generateMetadata` for dynamic title (pet name).

- [x] **Task 14 — Detail loading state**
  - Create `app/(public)/catalog/[id]/loading.tsx`.
  - Skeleton matching the detail layout.

- [x] **Task 15 — Detail not-found state**
  - Create `app/(public)/catalog/[id]/not-found.tsx`.
  - "Pet not found" message with link back to `/catalog`.

- [x] **Task 16 — Detail error state**
  - Create `app/(public)/catalog/[id]/error.tsx` as a Client Component.
  - "Something went wrong" + "Try again" button.

- [x] **Task 17 — Build verification**
  - Run `npx tsc --noEmit` — zero errors.
  - Run `npm run build` — successful build.
  - Verify `/catalog` and `/catalog/[id]` routes appear in the build output.
  - Verify both routes are accessible without auth (no redirect).
  - Verify draft pets do NOT appear in the catalog.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] Only published pets appear in the catalog.
- [ ] Draft and adopted pets are invisible.
- [ ] Cards show primary image or placeholder.
- [ ] Detail page shows PetImageGallery.
- [ ] No ownerId, Edit links, or management controls are visible.
- [ ] Pages work without authentication.
- [ ] Loading skeletons render correctly.
- [ ] Not-found state handles missing/unpublished pets.
- [ ] Error states catch failures gracefully.
- [ ] Responsive grid (1/2/3 columns).
- [ ] Age displayed in human-readable format.
- [ ] No N+1 queries (single findMany with include).
- [ ] No TypeScript `any` types introduced.
- [ ] Build passes with zero errors.
