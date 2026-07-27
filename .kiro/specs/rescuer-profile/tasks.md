# Implementation Tasks — Rescuer Profile

## References
- #[[file:.kiro/specs/rescuer-profile/requirements.md]]
- #[[file:.kiro/specs/rescuer-profile/design.md]]

---

## Task Order Rationale

Tasks follow the bottom-up architecture:
**schema → types → Zod schema → repository → service → API → components → pages → integration → verification**

---

## Tasks

- [x] **Task 1 — Prisma schema: RescuerProfile model**
  - Add `RescuerProfile` model with fields: id, ownerId (@unique), displayName, bio, city, state, phone (optional), websiteUrl (optional), imageUrl (optional), createdAt, updatedAt.
  - Add `@@index([ownerId])`.
  - Run `npx prisma validate`.
  - Run `npx prisma migrate dev --name add-rescuer-profile`.
  - Run `npx prisma generate`.

- [x] **Task 2 — TypeScript types**
  - Create `types/profile.types.ts` with:
    - `CreateOrUpdateProfileInput` (displayName, bio, city, state, phone?, websiteUrl?, imageUrl?)
    - `RescuerProfileType` (full record including ownerId)
    - `PublicRescuerProfile` (public-safe subset, excludes ownerId)

- [x] **Task 3 — Zod schema**
  - Create `schemas/profile.schema.ts` with `profileSchema`.
  - Validates: displayName (1–100), bio (10–500), city (1–100), state (1–100), phone (optional, max 20), websiteUrl (optional, URL, max 255), imageUrl (optional, URL, max 500).
  - Allow empty strings for optional fields (`.or(z.literal(""))` pattern).
  - Use Zod 4 API with error message constants.

- [x] **Task 4 — Profile repository**
  - Create `repositories/profile.repository.ts` with:
    - `findByOwnerId(ownerId)` — single lookup by owner
    - `findById(id)` — single lookup by profile ID (for public page)
    - `upsert(ownerId, data)` — create or update using Prisma upsert

- [x] **Task 5 — Pet repository extension**
  - Add `findPublishedByOwnerWithPrimaryImage(ownerId)` to `repositories/pet.repository.ts`.
  - Queries published pets for a specific owner, includes primary image.
  - Used by the public rescuer profile page.

- [x] **Task 6 — Profile service**
  - Create `services/profile.service.ts` with:
    - `upsertProfile(ownerId, input)` — calls repository upsert, sanitizes empty optional fields to null
    - `getProfileForOwner(ownerId)` — for the private management page
    - `getPublicProfile(profileId)` — for the public page (maps to PublicRescuerProfile)
    - `getProfileByOwnerId(ownerId)` — for the catalog integration (returns PublicRescuerProfile | null)

- [x] **Task 7 — Catalog service extension**
  - Add `getPublishedPetsByOwner(ownerId)` to `services/catalog.service.ts`.
  - Calls `findPublishedByOwnerWithPrimaryImage` and maps to `PublicPetCard[]`.

- [x] **Task 8 — API: PUT /api/profile**
  - Create `app/api/profile/route.ts`.
  - Auth required.
  - Validate body with `profileSchema`.
  - Call `upsertProfile(user.id, data)`.
  - Return 200 with `ApiResponse<RescuerProfileType>`.

- [x] **Task 9 — RescuerProfileForm component**
  - Create `components/profile/RescuerProfileForm.tsx` as Client Component.
  - Props: `{ profile: RescuerProfileType | null }`.
  - Pre-fills if profile exists; empty for creation.
  - Fields: displayName, bio (textarea), city, state, phone (optional), websiteUrl (optional), imageUrl (optional).
  - Submits via `PUT /api/profile`.
  - Shows success message after save (stays on page, does not redirect).

- [x] **Task 10 — Private profile page**
  - Create `app/(main)/profile/page.tsx` as async Server Component.
  - Fetches `getProfileForOwner(user.id)`.
  - Renders `<RescuerProfileForm profile={profile} />`.
  - Export metadata: `{ title: "My Profile" }`.

- [x] **Task 11 — Profile page loading/error**
  - Create `app/(main)/profile/loading.tsx` — skeleton.
  - Create `app/(main)/profile/error.tsx` — error boundary.

- [x] **Task 12 — PublicProfileView component**
  - Create `components/profile/PublicProfileView.tsx` as Server Component.
  - Props: `{ profile: PublicRescuerProfile }`.
  - Displays: image (or placeholder), display name, bio, city/state, phone, website link (clickable).
  - No edit controls.

- [x] **Task 13 — Public rescuer profile page**
  - Create `app/(public)/rescuers/[id]/page.tsx` as async Server Component.
  - Fetches profile via `getPublicProfile(id)`.
  - If null → `notFound()`.
  - Fetches published pets via `getPublishedPetsByOwner(profile.ownerId)` — note: ownerId is available server-side from the full profile record, just not exposed in the response type.
  - Renders `<PublicProfileView>` + `<CatalogGrid>` for pets.
  - Implements `generateMetadata` for dynamic title.

- [x] **Task 14 — Public rescuer page states**
  - Create `app/(public)/rescuers/[id]/loading.tsx` — skeleton.
  - Create `app/(public)/rescuers/[id]/not-found.tsx` — 404.
  - Create `app/(public)/rescuers/[id]/error.tsx` — error boundary.

- [x] **Task 15 — Catalog integration**
  - Update `services/catalog.service.ts` → `getPublishedPetById` to also return a `rescuerProfileId` field (nullable) by querying the profile for the pet's owner.
  - Update `types/pet.types.ts` → `PublicPetDetail` to include `rescuerProfileId: string | null`.
  - Update `app/(public)/catalog/[id]/page.tsx` to render a "View rescuer profile" link when `rescuerProfileId` is available.

- [x] **Task 16 — Navigation update**
  - Add "Profile" link to `app/(main)/layout.tsx` nav.

- [x] **Task 17 — Build verification**
  - Run `npx prisma validate`.
  - Run `npx tsc --noEmit`.
  - Run `npm run build`.
  - Verify all new routes in build output.
  - Test:
    1. Create profile at `/profile`.
    2. Update profile.
    3. View public page at `/rescuers/[id]`.
    4. Published pets appear on rescuer page.
    5. Link from catalog detail page works.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] Profile can be created and updated from `/profile`.
- [ ] Validation works client-side and server-side.
- [ ] Public profile at `/rescuers/[id]` shows correct info.
- [ ] Only published pets appear on the public profile.
- [ ] No ownerId or sensitive data exposed publicly.
- [ ] Profile not-found returns 404.
- [ ] Catalog pet detail links to rescuer profile.
- [ ] Loading/error states on all new pages.
- [ ] Upsert pattern works (create + update in single endpoint).
- [ ] No TypeScript `any` types introduced.
- [ ] All API responses use standard envelope.
- [ ] Build passes with zero errors.

