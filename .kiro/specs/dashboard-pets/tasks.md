# Implementation Tasks — Dashboard Pet Listing

## References
- #[[file:.kiro/specs/dashboard-pets/requirements.md]]
- #[[file:.kiro/specs/dashboard-pets/design.md]]

---

## Task Order Rationale

Tasks follow the same bottom-up dependency order:
**types → repository → service → components → page integration → states → verification**

Existing infrastructure (Prisma, auth, UI library) is already in place.

---

## Tasks

- [x] **Task 1 — TypeScript type: PetWithPrimaryImage**
  - Add `PetWithPrimaryImage` type to `types/pet.types.ts`.
  - Definition: `PetType & { primaryImageUrl: string | null }`.
  - Do not modify existing types.

- [x] **Task 2 — Repository: findByOwnerWithPrimaryImage**
  - Add `findByOwnerWithPrimaryImage(ownerId: string)` to `repositories/pet.repository.ts`.
  - Uses `prisma.pet.findMany` with:
    - `where: { ownerId }`
    - `include: { images: { where: { order: 0 }, take: 1 } }`
    - `orderBy: { createdAt: "desc" }`
  - Returns the Prisma result type (Pet with included images array).
  - Do not modify existing `create` or `findById` methods.

- [x] **Task 3 — Service: getPetsForOwner**
  - Add `getPetsForOwner(ownerId: string): Promise<PetWithPrimaryImage[]>` to `services/pet.service.ts`.
  - Calls `petRepository.findByOwnerWithPrimaryImage(ownerId)`.
  - Maps the result to extract `primaryImageUrl` from `images[0]?.url ?? null`.
  - Do not modify existing service functions.

- [x] **Task 4 — PetCard component**
  - Create `components/pets/PetCard.tsx` as a Server Component.
  - Props: `{ pet: PetWithPrimaryImage }`.
  - Structure:
    - Image container (3:2 aspect ratio): `next/image` if `primaryImageUrl` exists, otherwise a placeholder with `PawPrint` icon.
    - Body: pet name (bold), status badge, species + breed, city/state, formatted date.
    - Footer: "View" link to `/pets/[id]`, "Edit" link to `/pets/[id]/edit`.
  - Status badge reuses the same color mapping as PetDetailView (draft=neutral, published=green, adopted=blue).
  - Uses `formatDate`, `capitalize` from `utils/format.ts`.

- [x] **Task 5 — PetCardGrid component**
  - Create `components/pets/PetCardGrid.tsx` as a Server Component.
  - Props: `{ pets: PetWithPrimaryImage[] }`.
  - Renders a heading: "Your pets (N)" where N is the array length.
  - Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
  - Maps over pets and renders `<PetCard>` for each.

- [x] **Task 6 — PetEmptyState component**
  - Create `components/pets/PetEmptyState.tsx` as a Server Component.
  - Centered layout with:
    - `PawPrint` icon (large, muted color).
    - Heading: "You haven't registered any pets yet."
    - Subtext: "Start by registering your first pet."
    - CTA: Link styled as button → `/pets/new`.

- [x] **Task 7 — Dashboard loading state**
  - Create `app/(main)/dashboard/loading.tsx` as a Server Component.
  - Renders 6 skeleton cards in the same responsive grid as PetCardGrid.
  - Each skeleton: image placeholder (aspect 3:2) + 4 text placeholders + 2 action placeholders.
  - Uses `animate-pulse` and `bg-muted`.

- [x] **Task 8 — Dashboard error state**
  - Create `app/(main)/dashboard/error.tsx` as a Client Component (`"use client"`).
  - Accepts `{ error, reset }` from the Next.js error boundary.
  - Displays "Something went wrong" heading, user-friendly message, and "Try again" button.
  - Does not expose error internals.

- [x] **Task 9 — Dashboard page rewrite**
  - Rewrite `app/(main)/dashboard/page.tsx` as an async Server Component.
  - Flow:
    1. Call `getCurrentUserFromCookies()` for auth.
    2. If no user → `notFound()` (middleware should have caught this, but defense-in-depth).
    3. Call `getPetsForOwner(user.id)`.
    4. Render Quick Actions section (preserved: "Register a pet" button).
    5. If `pets.length === 0` → render `<PetEmptyState />`.
    6. Otherwise → render `<PetCardGrid pets={pets} />`.
  - Keep `export const metadata = { title: "Dashboard" }`.

- [x] **Task 10 — Build verification**
  - Run `npx tsc --noEmit` — zero TypeScript errors.
  - Run `npm run build` — successful production build.
  - Verify `/dashboard` route builds successfully.
  - Manually test:
    1. Visit `/dashboard` with seeded pets → cards appear.
    2. Delete all pets → empty state appears.
    3. Verify responsive layout at mobile, tablet, and desktop widths.
    4. Verify View link navigates to correct pet detail page.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] All user's pets are displayed on the dashboard.
- [ ] Cards show primary image or placeholder.
- [ ] Status badge has correct colors per status value.
- [ ] Cards display name, species, breed, location, and date.
- [ ] View link navigates to `/pets/[id]`.
- [ ] Edit link navigates to `/pets/[id]/edit`.
- [ ] Empty state shown when no pets exist.
- [ ] Loading skeleton matches the card layout.
- [ ] Error state catches failures gracefully.
- [ ] Grid is responsive (1/2/3 columns).
- [ ] Pets are ordered newest first.
- [ ] No TypeScript `any` types introduced.
- [ ] No client-side fetch for initial data load (Server Component).
- [ ] Build passes with zero errors.
