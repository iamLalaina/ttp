# Technical Design — Pet Registration

## References
- #[[file:steering/product.md]]
- #[[file:steering/tech.md]]
- #[[file:steering/structure.md]]

---

## Architecture Overview

The pet registration feature follows the established unidirectional layered architecture:

```
Page (Server Component)
  └── PetForm (Client Component)
        └── POST /api/pets  (Route Handler)
              └── pet.service.ts  (Service Layer)
                    └── pet.repository.ts  (Repository Layer)
                          └── PostgreSQL via Prisma
```

The page itself is a Server Component that renders the shell and passes no data props to `PetForm` — the form is entirely self-contained as a Client Component since it requires interactivity, state, and browser events.

---

## Data Model

### Prisma Schema — `Pet`

```prisma
// prisma/schema.prisma

enum Species {
  dog
  cat
}

enum Sex {
  male
  female
}

enum PetSize {
  small
  medium
  large
}

enum VaccinationStatus {
  up_to_date
  partial
  unknown
}

enum YesNoUnknown {
  yes
  no
  unknown
}

enum PetStatus {
  draft
  published
  adopted
}

model Pet {
  id                    String            @id @default(cuid())
  ownerId               String
  name                  String
  species               Species
  breed                 String
  ageInMonths           Int
  sex                   Sex
  size                  PetSize
  healthStatus          String
  vaccinationStatus     VaccinationStatus
  sterilized            YesNoUnknown
  friendlyWithChildren  YesNoUnknown
  friendlyWithAnimals   YesNoUnknown
  description           String
  city                  String
  state                 String
  status                PetStatus         @default(draft)
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  @@index([ownerId])
  @@index([status])
  @@index([species])
}
```

**Design decisions:**
- `id` uses `cuid()` for URL-safe, sortable identifiers.
- `ownerId` is a plain string (Cognito `sub` UUID) — no foreign key to a local `User` table since authentication is delegated to AWS Cognito. A `User` model may be introduced in a future spec if local user metadata is needed.
- `ageInMonths` stores age as an integer number of months for precision and easy range filtering (e.g., "under 12 months").
- `status` defaults to `draft` at the DB level as a safety net, in addition to being enforced at the service layer.
- All enum values are lowercase to match PostgreSQL conventions and avoid casing bugs in queries.

---

## Zod Validation Schema

```
// src/schemas/pet.schema.ts
```

### `createPetSchema`

| Field | Zod Rule |
|---|---|
| `name` | `z.string().min(1).max(100)` |
| `species` | `z.enum(['dog', 'cat'])` |
| `breed` | `z.string().min(1).max(100)` |
| `ageInMonths` | `z.number().int().positive().max(300)` |
| `sex` | `z.enum(['male', 'female'])` |
| `size` | `z.enum(['small', 'medium', 'large'])` |
| `healthStatus` | `z.string().min(1).max(1000)` |
| `vaccinationStatus` | `z.enum(['up_to_date', 'partial', 'unknown'])` |
| `sterilized` | `z.enum(['yes', 'no', 'unknown'])` |
| `friendlyWithChildren` | `z.enum(['yes', 'no', 'unknown'])` |
| `friendlyWithAnimals` | `z.enum(['yes', 'no', 'unknown'])` |
| `description` | `z.string().min(10).max(500)` |
| `city` | `z.string().min(1).max(100)` |
| `state` | `z.string().min(1).max(100)` |

The same schema is shared between client (React Hook Form `zodResolver`) and server (Route Handler `safeParse`). It lives in `src/schemas/pet.schema.ts` and imports only from `zod` — no framework dependencies.

---

## API Design

### `POST /api/pets`

**File:** `src/app/api/pets/route.ts`

**Auth:** Required. The Route Handler extracts and verifies the Cognito JWT from the `Authorization` header or httpOnly cookie. If absent or invalid, returns `401`.

**Request body:** `application/json` matching `createPetSchema`.

**Success response — `201 Created`:**
```json
{
  "data": {
    "id": "cuid...",
    "name": "Luna",
    "species": "dog",
    "status": "draft",
    "createdAt": "2026-07-26T00:00:00.000Z"
  },
  "error": null
}
```
*(Full pet object returned; client uses `data.id` to redirect.)*

**Error responses:**

| Scenario | Status | `error.code` |
|---|---|---|
| Missing or invalid JWT | 401 | `UNAUTHORIZED` |
| Zod validation failure | 400 | `VALIDATION_ERROR` |
| Unexpected server error | 500 | `INTERNAL_ERROR` |

All error responses follow the envelope: `{ data: null, error: { code: string, message: string } }`.

---

## Component Breakdown

### Page — `src/app/(main)/pets/new/page.tsx`
- **Type:** Server Component
- **Responsibility:** Renders page chrome (title, breadcrumb) and mounts `<PetForm />`.
- **No data fetching** at this stage.
- Exports metadata for the `<head>` (`title: "Register a pet — TTP"`).

### `src/components/pets/PetForm.tsx`
- **Type:** Client Component (`"use client"`)
- **Responsibility:** The complete registration form. Manages form state via React Hook Form + Zod resolver. Handles submission, loading state, and error display.
- **Props:** None (self-contained).
- **Internal sections** (rendered as fieldsets for accessibility and grouping):
  1. **Basic info** — name, species, breed, age, sex, size
  2. **Health & behavior** — health status, vaccination status, sterilized, friendly with children, friendly with animals
  3. **Location & description** — city, state, short description
- **On submit:**
  1. Calls `POST /api/pets` with form data.
  2. On success: shows success toast, calls `router.push('/pets/[id]')`.
  3. On error: displays a global error banner; field values are preserved.

### `src/components/pets/PetFormFields.tsx` *(optional sub-component)*
- Reusable controlled field wrappers (label + input + error message) built on shadcn/ui primitives. Keeps `PetForm.tsx` focused on orchestration.

### shadcn/ui components used
- `Input` — text fields
- `Select` — all enum fields
- `Textarea` — health status and description
- `Button` — submit
- `Label` — field labels
- `Alert` / Toast — global error and success feedback

---

## Service Layer

### `src/services/pet.service.ts` — `createPet`

```
async function createPet(input: CreatePetInput, ownerId: string): Promise<PetType>
```

**Responsibilities:**
- Applies any business rules before persistence (e.g., future: limit on active drafts per owner).
- Delegates to `petRepository.create(...)`.
- Returns the full created `PetType` object.
- Does **not** catch errors — they propagate to the Route Handler's try/catch.

---

## Repository Layer

### `src/repositories/pet.repository.ts`

```
petRepository.create(data: CreatePetInput & { ownerId: string }): Promise<Pet>
```

- Calls `prisma.pet.create({ data })`.
- The `status` field is not passed — it defaults to `draft` via the Prisma schema default.
- No other methods are in scope for this spec.

---

## TypeScript Types

### `src/types/pet.types.ts`

```
// Input type — mirrors createPetSchema output
type CreatePetInput = {
  name: string
  species: 'dog' | 'cat'
  breed: string
  ageInMonths: number
  sex: 'male' | 'female'
  size: 'small' | 'medium' | 'large'
  healthStatus: string
  vaccinationStatus: 'up_to_date' | 'partial' | 'unknown'
  sterilized: 'yes' | 'no' | 'unknown'
  friendlyWithChildren: 'yes' | 'no' | 'unknown'
  friendlyWithAnimals: 'yes' | 'no' | 'unknown'
  description: string
  city: string
  state: string
}

// Full persisted type — matches Prisma Pet model
type PetType = CreatePetInput & {
  id: string
  ownerId: string
  status: 'draft' | 'published' | 'adopted'
  createdAt: Date
  updatedAt: Date
}
```

### `src/types/api.types.ts`

```
type ApiResponse<T> = 
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }
```

---

## Validation Rules (Complete Reference)

| Field | Rule | Error message |
|---|---|---|
| `name` | Required, 1–100 chars | "Pet name is required" / "Name must be 100 characters or fewer" |
| `species` | Must be `dog` or `cat` | "Select a valid species" |
| `breed` | Required, 1–100 chars | "Breed is required" / "Breed must be 100 characters or fewer" |
| `ageInMonths` | Required, integer, min 1, max 300 | "Age is required" / "Age must be a whole number of months" / "Age cannot exceed 300 months" |
| `sex` | Must be `male` or `female` | "Select a valid sex" |
| `size` | Must be `small`, `medium`, or `large` | "Select a valid size" |
| `healthStatus` | Required, 1–1000 chars | "Health status is required" / "Health status must be 1000 characters or fewer" |
| `vaccinationStatus` | Must be `up_to_date`, `partial`, or `unknown` | "Select a vaccination status" |
| `sterilized` | Must be `yes`, `no`, or `unknown` | "Select a sterilization status" |
| `friendlyWithChildren` | Must be `yes`, `no`, or `unknown` | "Select an option for children compatibility" |
| `friendlyWithAnimals` | Must be `yes`, `no`, or `unknown` | "Select an option for animal compatibility" |
| `description` | Required, 10–500 chars | "Description must be at least 10 characters" / "Description must be 500 characters or fewer" |
| `city` | Required, 1–100 chars | "City is required" |
| `state` | Required, 1–100 chars | "State is required" |

All validation messages are defined as constants in the schema file to enable easy localization in the future.

---

## File Map

The following files are created or modified by this feature:

```
prisma/
  schema.prisma                                   ← Add Pet model + enums

src/
  app/
    (main)/
      pets/
        new/
          page.tsx                                ← New page (Server Component)

  components/
    pets/
      PetForm.tsx                                 ← New (Client Component)

  services/
    pet.service.ts                                ← New

  repositories/
    pet.repository.ts                             ← New

  schemas/
    pet.schema.ts                                 ← New

  types/
    pet.types.ts                                  ← New
    api.types.ts                                  ← New (or extend if exists)

  lib/
    prisma.ts                                     ← New (PrismaClient singleton)
    env.ts                                        ← New (Zod env validation)

  app/
    api/
      pets/
        route.ts                                  ← New (POST handler)
```

---

## Environment Variables Required

This feature depends on the following variables being present in `.env.local`:

```
DATABASE_URL               # PostgreSQL connection string
AWS_REGION                 # Required by Cognito token verifier
AWS_COGNITO_USER_POOL_ID   # For JWT verification
AWS_COGNITO_CLIENT_ID      # For JWT verification
NEXT_PUBLIC_APP_URL        # Used in redirects
```

These must be added to `.env.example` with empty values as documentation.

---

## Auth Integration Boundary

This spec does **not** implement authentication. However, the Route Handler and the protected page both depend on auth being functional. The following contracts are assumed:

- `middleware.ts` redirects unauthenticated requests to `/login` before they reach `(main)/**` routes.
- A `getCurrentUser(req)` helper in `src/lib/cognito.ts` verifies the JWT and returns `{ id: string }` (the Cognito `sub`), or `null` if invalid.
- These will be stubs or provided by the auth spec. The pet registration spec consumes them without implementing them.
