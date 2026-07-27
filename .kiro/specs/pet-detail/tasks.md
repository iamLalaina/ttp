# Implementation Tasks — Pet Detail Page

## References
- #[[file:.kiro/specs/pet-detail/requirements.md]]
- #[[file:.kiro/specs/pet-detail/design.md]]

---

## Task Order Rationale

Tasks follow the same bottom-up order as the pet-registration spec:
**utilities → repository → service → auth adaptation → page + components → verification**

Each task is self-contained and verifiable before moving to the next.

---

## Tasks

- [x] **Task 1 — Utility functions**
  - Create `utils/format.ts` with the following pure functions:
    - `formatAge(ageInMonths: number): string` — converts months to "X years, Y months"
    - `formatDate(date: Date): string` — formats as "Jul 27, 2026"
    - `capitalize(str: string): string` — capitalizes first letter
    - `formatEnumLabel(value: string): string` — converts snake_case enum to readable label (e.g., "up_to_date" → "Up to date")
  - All functions must have explicit return types and no side effects.
  - No external dependencies — pure TypeScript only.

- [x] **Task 2 — Repository: findById**
  - Add a `findById(id: string): Promise<Pet | null>` method to the existing `petRepository` object in `repositories/pet.repository.ts`.
  - Uses `prisma.pet.findUnique({ where: { id } })`.
  - Returns the full `Pet` record or `null`.
  - Do not modify the existing `create` method.

- [x] **Task 3 — Service: getPetByIdForOwner**
  - Add a `getPetByIdForOwner(id: string, ownerId: string): Promise<PetType | null>` function to `services/pet.service.ts`.
  - Calls `petRepository.findById(id)`.
  - If `null` or `pet.ownerId !== ownerId` → returns `null`.
  - Otherwise returns the pet cast as `PetType`.
  - Do not modify the existing `createPet` function.

- [x] **Task 4 — Auth helper for Server Components**
  - Add a `getCurrentUserFromCookies(): Promise<{ id: string } | null>` function to `lib/cognito.ts`.
  - Uses `cookies()` from `next/headers` to read the `auth-token` cookie.
  - Returns `{ id: "stub-user-id" }` if a token is present (same stub as the existing helper).
  - Add `// TODO: replace with real JWT verification (auth spec)` comment.
  - Do not modify the existing `getCurrentUser(req)` function.

- [x] **Task 5 — PetDetailView component**
  - Create `components/pets/PetDetailView.tsx` as a Server Component.
  - Props: `{ pet: PetType }`.
  - Renders all fields from the Pet model in a structured layout:
    - Header: name (H1), status badge, edit link
    - Info grid (responsive 2-col): species, breed, age (formatted), sex, size, vaccination, sterilized, friendly with children, friendly with animals, location
    - Health status section: full text
    - Description section: full text
    - Footer: creation date formatted
  - Uses `formatAge`, `formatDate`, `capitalize`, `formatEnumLabel` from `utils/format.ts`.
  - Status badge uses Tailwind utility classes with conditional colors.
  - Edit link points to `/pets/[id]/edit`.

- [x] **Task 6 — Loading state**
  - Create `app/(main)/pets/[id]/loading.tsx`.
  - Server Component that renders a skeleton placeholder matching the PetDetailView layout.
  - Uses `animate-pulse` and `bg-muted` on placeholder blocks.
  - Layout matches the detail view so there's no layout shift when content loads.

- [x] **Task 7 — Not-found state**
  - Create `app/(main)/pets/[id]/not-found.tsx`.
  - Displays "Pet not found" heading, explanatory text, and a "Back to Dashboard" link.
  - No interactivity required — can be a Server Component.

- [x] **Task 8 — Error state**
  - Create `app/(main)/pets/[id]/error.tsx` as a Client Component (`"use client"`).
  - Accepts `{ error, reset }` props from the Next.js error boundary.
  - Displays "Something went wrong" heading, user-friendly message, and a "Try again" button that calls `reset()`.
  - Does not expose error details to the user.

- [x] **Task 9 — Pet detail page**
  - Create `app/(main)/pets/[id]/page.tsx` as an async Server Component.
  - Implements `generateMetadata` for dynamic `<title>` based on pet name.
  - Flow:
    1. Await `params` to extract `id`.
    2. Call `getCurrentUserFromCookies()` to get the authenticated user.
    3. If no user → call `notFound()`.
    4. Call `getPetByIdForOwner(id, user.id)`.
    5. If null → call `notFound()`.
    6. Render breadcrumb + `<PetDetailView pet={pet} />`.
  - Breadcrumb: Dashboard → Pet Name (with links).

- [x] **Task 10 — Build verification**
  - Run `npx tsc --noEmit` — confirm zero TypeScript errors.
  - Run `npm run build` — confirm successful production build.
  - Verify the `/pets/[id]` route appears in the build output as a dynamic route (`ƒ`).
  - Manually test by navigating to `/pets/seed-pet-001` — confirm all fields render correctly.
  - Navigate to `/pets/nonexistent` — confirm the not-found page renders.

---

## Completion Checklist

Before marking this spec as done, verify:

- [x] All 14 pet fields are displayed on the detail page.
- [x] The page uses Server Components for data fetching (no client-side fetch).
- [x] `loading.tsx` provides instant visual feedback.
- [x] `not-found.tsx` renders for invalid or unauthorized pet IDs.
- [x] `error.tsx` catches unexpected failures gracefully.
- [x] The architecture follows Route → Service → Repository (no layer skipping).
- [x] The ownership check prevents viewing another user's pets.
- [x] Age is displayed in human-readable format.
- [x] Status badge has correct colors per status value.
- [x] Dynamic page title shows the pet's name.
- [x] No TypeScript `any` types introduced.
- [x] Build passes with zero errors.
