# Technical Design — Pet Edit

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/pet-registration/design.md]]
- #[[file:.kiro/specs/pet-detail/design.md]]

---

## Architecture Overview

```
Edit Page (Server Component)
  └── Fetches pet data via getPetByIdForOwner (existing)
        └── Renders PetEditForm (Client Component)
              └── PATCH /api/pets/[id] (Route Handler)
                    └── updatePet() — services/pet.service.ts
                          └── petRepository.update() — repositories/pet.repository.ts
                                └── prisma.pet.update() — PostgreSQL
```

The edit page reuses the existing `getPetByIdForOwner` for data loading and ownership verification. The form component is a new `PetEditForm` that shares the same field structure as `PetForm` but accepts initial values and submits via PATCH instead of POST.

---

## Key Design Decisions

### Why a new component instead of making PetForm generic?

The create and edit forms have different concerns:
- **Create**: all fields start empty, submits POST, creates new record, redirects to new ID
- **Edit**: fields start pre-filled, submits PATCH to existing ID, includes status field, redirects back to detail

Making `PetForm` generic (mode="create"|"edit") would require significant conditional logic and props threading. A separate `PetEditForm` with shared sub-components is cleaner.

### Shared elements
- Same field structure and layout (3 fieldsets)
- Same Zod schema for field validation (extended with status)
- Same shadcn/ui components
- Same `FieldError` and `SelectField` patterns

---

## TypeScript Types

### `types/pet.types.ts` — Extension

```ts
/** Input for updating an existing pet. Same as create + optional status change. */
export type UpdatePetInput = CreatePetInput & {
  status: "draft" | "published";
};
```

Note: `adopted` is excluded from the input — it can only be set through the adoption flow (future spec).

---

## Zod Schema

### `schemas/pet.schema.ts` — Extension

```ts
/** Schema for updating an existing pet. Extends createPetSchema with status. */
export const updatePetSchema = createPetSchema.extend({
  status: z.enum(["draft", "published"], { error: "Select a valid status" }),
});

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
```

This reuses all validation rules from `createPetSchema` and adds the status field.

---

## Repository Layer — Extension

### `repositories/pet.repository.ts` — New method

```ts
async update(id: string, data: Partial<UpdatePetInput>): Promise<Pet> {
  return prisma.pet.update({ where: { id }, data });
}
```

Uses `Partial<UpdatePetInput>` to support full or partial updates. The Route Handler will always send all fields (full replacement), but the type allows flexibility.

---

## Service Layer — Extension

### `services/pet.service.ts` — New function

```ts
async function updatePet(
  id: string,
  input: UpdatePetInput,
  ownerId: string,
): Promise<PetType> {
  // 1. Ownership check
  const existing = await petRepository.findById(id);
  if (!existing || existing.ownerId !== ownerId) {
    throw new PetServiceError("NOT_FOUND", "Pet not found");
  }

  // 2. Business rules
  //    - Cannot change to "adopted" via edit (enforced by schema)
  //    - Cannot edit an adopted pet (future consideration)

  // 3. Update
  const updated = await petRepository.update(id, input);
  return updated as PetType;
}
```

A `PetServiceError` class (same pattern as `ImageServiceError`) enables the Route Handler to map errors to HTTP status codes.

---

## API Route

### `PATCH /api/pets/[id]`

**File:** `app/api/pets/[id]/route.ts`

**Flow:**
1. Auth check (`getCurrentUser`).
2. Parse and validate body with `updatePetSchema`.
3. Call `updatePet(id, data, user.id)`.
4. On `PetServiceError("NOT_FOUND")` → 404.
5. On success → 200 with updated pet in `ApiResponse<PetType>`.

---

## Page Component

### `app/(main)/pets/[id]/edit/page.tsx`

**Type:** Async Server Component

**Flow:**
1. Get user via `getCurrentUserFromCookies()`.
2. Fetch pet via `getPetByIdForOwner(id, user.id)`.
3. If null → `notFound()`.
4. Render `<PetEditForm pet={pet} />`.

**Metadata:** `generateMetadata` returns `{ title: "Edit {pet.name}" }`.

---

## PetEditForm Component

### `components/pets/PetEditForm.tsx`

**Type:** Client Component (`"use client"`)

**Props:** `{ pet: PetType }`

**Differences from PetForm:**
- Initializes all fields with `pet.*` values as `defaultValues`.
- Adds a "Status" select field (draft/published).
- Submits via `PATCH /api/pets/${pet.id}` instead of `POST /api/pets`.
- On success: redirects to `/pets/${pet.id}` (back to detail).
- Submit button label: "Save changes" (not "Register pet").

**Field layout (same 3 fieldsets + status):**
1. Basic info: name, species, breed, age, sex, size
2. Health & behavior: healthStatus, vaccinationStatus, sterilized, friendlyWithChildren, friendlyWithAnimals
3. Location & description: city, state, description
4. Publication: status (draft/published)

---

## Loading / Error / Not-Found States

### `app/(main)/pets/[id]/edit/loading.tsx`
Skeleton matching the form layout.

### `app/(main)/pets/[id]/edit/not-found.tsx`
Reuse the same pattern: "Pet not found" + link to dashboard.

No separate `error.tsx` needed — the parent `[id]/error.tsx` already covers this route segment.

---

## File Map

```
types/
  pet.types.ts                              ← Add UpdatePetInput

schemas/
  pet.schema.ts                             ← Add updatePetSchema

repositories/
  pet.repository.ts                         ← Add update() method

services/
  pet.service.ts                            ← Add updatePet() + PetServiceError

app/
  api/
    pets/
      [id]/
        route.ts                            ← New: PATCH handler

  (main)/
    pets/
      [id]/
        edit/
          page.tsx                           ← Edit page (Server Component)
          loading.tsx                        ← Skeleton
          not-found.tsx                      ← 404 state

components/
  pets/
    PetEditForm.tsx                          ← New Client Component
```
