# Implementation Tasks — Pet Edit

## References
- #[[file:.kiro/specs/pet-edit/requirements.md]]
- #[[file:.kiro/specs/pet-edit/design.md]]

---

## Task Order Rationale

Tasks follow the bottom-up architecture pattern:
**types → schema → repository → service → API route → component → page → states → verification**

---

## Tasks

- [x] **Task 1 — TypeScript type: UpdatePetInput**
  - Add `UpdatePetInput` to `types/pet.types.ts`.
  - Definition: `CreatePetInput & { status: "draft" | "published" }`.
  - Note: `adopted` is intentionally excluded — only settable via the adoption flow.
  - Do not modify existing types.

- [x] **Task 2 — Zod schema: updatePetSchema**
  - Add `updatePetSchema` to `schemas/pet.schema.ts`.
  - Extends `createPetSchema` with `status: z.enum(["draft", "published"])`.
  - Export the inferred type.
  - Use Zod 4 API (same `error:` pattern).
  - Do not modify existing `createPetSchema`.

- [x] **Task 3 — Repository: update method**
  - Add `update(id: string, data: UpdatePetInput): Promise<Pet>` to `repositories/pet.repository.ts`.
  - Uses `prisma.pet.update({ where: { id }, data })`.
  - Do not modify existing methods.

- [x] **Task 4 — Service: updatePet + PetServiceError**
  - Add `PetServiceError` class to `services/pet.service.ts` (same pattern as `ImageServiceError`).
  - Add `updatePet(id: string, input: UpdatePetInput, ownerId: string): Promise<PetType>`.
  - Flow: ownership check → update → return.
  - Throws `PetServiceError("NOT_FOUND")` if pet missing or not owned.
  - Do not modify existing service functions.

- [x] **Task 5 — API Route: PATCH /api/pets/[id]**
  - Create `app/api/pets/[id]/route.ts` with a `PATCH` handler.
  - Auth → validate body with `updatePetSchema` → call `updatePet()` → return 200.
  - Handle `PetServiceError("NOT_FOUND")` → 404.
  - Standard `ApiResponse<PetType>` envelope.

- [x] **Task 6 — PetEditForm component**
  - Create `components/pets/PetEditForm.tsx` as a Client Component.
  - Props: `{ pet: PetType }`.
  - Reuses same field structure as PetForm (3 fieldsets + status section).
  - Pre-populates all fields from `pet` via `defaultValues`.
  - Adds Status select (Draft / Published).
  - Submits via `PATCH /api/pets/${pet.id}`.
  - On success: redirect to `/pets/${pet.id}`.
  - On error: global alert, field values preserved.
  - Submit button: "Save changes".

- [x] **Task 7 — Edit page**
  - Create `app/(main)/pets/[id]/edit/page.tsx` as async Server Component.
  - Uses `getCurrentUserFromCookies()` + `getPetByIdForOwner(id, user.id)`.
  - If null → `notFound()`.
  - Renders breadcrumb + heading + `<PetEditForm pet={pet} />`.
  - Implements `generateMetadata` for "Edit {pet.name}" title.
  - Uses `cache()` to deduplicate calls between metadata and page.

- [x] **Task 8 — Edit loading state**
  - Create `app/(main)/pets/[id]/edit/loading.tsx`.
  - Skeleton matching the form layout (same pattern as registration page).

- [x] **Task 9 — Edit not-found state**
  - Create `app/(main)/pets/[id]/edit/not-found.tsx`.
  - "Pet not found" message + link to dashboard.

- [x] **Task 10 — Build verification**
  - Run `npx tsc --noEmit` — zero errors.
  - Run `npm run build` — successful build.
  - Verify `/pets/[id]/edit` route appears in the build output.
  - Manually test:
    1. Navigate to `/pets/seed-pet-001/edit` → form pre-filled.
    2. Change a field and save → redirected to detail with updated value.
    3. Change status to "published" → pet appears in catalog.
    4. Navigate to another user's pet edit → 404.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] Edit form pre-populates with current pet data.
- [ ] All 14 editable fields are present.
- [ ] Status field shows only "Draft" and "Published".
- [ ] Validation errors appear inline (same as registration).
- [ ] Successful update redirects to `/pets/[id]`.
- [ ] Server-side ownership check returns 404 for unauthorized.
- [ ] `PATCH /api/pets/[id]` validates with `updatePetSchema`.
- [ ] Publishing a pet makes it visible in `/catalog`.
- [ ] Unpublishing removes it from `/catalog`.
- [ ] No `ownerId` field exposed in the form.
- [ ] No TypeScript `any` types introduced.
- [ ] Build passes with zero errors.
