# Implementation Tasks — Pet Registration

## References
- #[[file:.kiro/specs/pet-registration/requirements.md]]
- #[[file:.kiro/specs/pet-registration/design.md]]

---

## Task Order Rationale

Tasks are ordered bottom-up following the dependency chain:
**infrastructure → data model → types & schemas → repository → service → API → UI**

Each task is self-contained and verifiable before moving to the next.

---

## Tasks

- [x] **Task 1 — Project dependencies**
  Install all packages required by this feature that are not yet present.
  - `prisma` and `@prisma/client`
  - `zod`
  - `react-hook-form`
  - `@hookform/resolvers`
  - `shadcn/ui` CLI init (if not done); add components: `button`, `input`, `select`, `textarea`, `label`, `alert`
  - `clsx` and `tailwind-merge` (for `cn` utility)
  - Verify `next`, `react`, `typescript` are already installed from the scaffold.

- [x] **Task 2 — Environment configuration**
  - Create `src/lib/env.ts` with a Zod schema that validates all required environment variables at startup.
    - Variables: `DATABASE_URL`, `AWS_REGION`, `AWS_COGNITO_USER_POOL_ID`, `AWS_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_APP_URL`.
  - Create `.env.example` at the project root listing every required variable with empty values and inline comments describing each one.
  - Add `.env.local` to `.gitignore` if not already present.

- [x] **Task 3 — Tailwind / utility setup**
  - Create `src/utils/cn.ts` — exports a `cn()` helper using `clsx` + `tailwind-merge`.
  - Verify `tailwind.config.ts` includes `src/**` in the `content` paths.

- [x] **Task 4 — Prisma schema and migration**
  - Schema is written and validates (`npx prisma validate` passes).
  - Prisma client generated (`npx prisma generate` passes).
  - Migration `20260727064530_add_pet_model` created and applied to Supabase PostgreSQL.
  - Initialize Prisma (`npx prisma init`) if `prisma/schema.prisma` does not exist.
  - Add the `Pet` model and all required enums (`Species`, `Sex`, `PetSize`, `VaccinationStatus`, `YesNoUnknown`, `PetStatus`) to `prisma/schema.prisma` exactly as specified in `design.md`.
  - Run `npx prisma migrate dev --name add-pet-model` to create and apply the migration.
  - Verify the migration file is generated under `prisma/migrations/`.

- [x] **Task 5 — Prisma client singleton**
  - Create `src/lib/prisma.ts` that exports a single `PrismaClient` instance, guarding against multiple instances in development (hot-reload safe pattern using `globalThis`).

- [x] **Task 6 — TypeScript types**
  - Create `src/types/api.types.ts` exporting `ApiResponse<T>` as defined in `design.md`.
  - Create `src/types/pet.types.ts` exporting `CreatePetInput` and `PetType` as defined in `design.md`.

- [x] **Task 7 — Zod validation schema**
  - Create `src/schemas/pet.schema.ts` exporting `createPetSchema` with all rules from the validation table in `design.md`.
  - Define all validation error messages as named string constants within the file.
  - Export the inferred type `CreatePetInput` from the schema (`z.infer<typeof createPetSchema>`) and ensure it matches `src/types/pet.types.ts`.

- [x] **Task 8 — Repository layer**
  - Create `src/repositories/pet.repository.ts` exporting a `petRepository` object.
  - Implement the `create(data: CreatePetInput & { ownerId: string }): Promise<Pet>` method using the Prisma singleton from Task 5.
  - Do not pass `status` — rely on the Prisma schema default of `draft`.

- [x] **Task 9 — Service layer**
  - Create `src/services/pet.service.ts` exporting `createPet(input: CreatePetInput, ownerId: string): Promise<PetType>`.
  - Delegate to `petRepository.create(...)`.
  - Add a `// TODO: enforce draft limit per owner (future spec)` comment at the business-rules section to document the extension point.

- [x] **Task 10 — Auth stub**
  - Create `src/lib/cognito.ts` exporting a `getCurrentUser(req: NextRequest): Promise<{ id: string } | null>` stub.
  - The stub should attempt to read the JWT from the `Authorization` header (`Bearer <token>`), log a warning that full verification is pending, and return a hardcoded `{ id: "stub-user-id" }` for local development.
  - Add a prominent `// TODO: replace with real JWT verification (auth spec)` comment.
  - This unblocks development and testing of the API route without requiring the auth spec to be complete.

- [x] **Task 11 — API Route Handler**
  - Create `src/app/api/pets/route.ts` implementing `POST /api/pets` as specified in `design.md`.
  - Steps inside the handler:
    1. Call `getCurrentUser(req)`; return `401` if null.
    2. Parse request body; return `400` with `VALIDATION_ERROR` if `createPetSchema.safeParse` fails.
    3. Call `createPet(parsed.data, user.id)`.
    4. Return `201` with the created pet wrapped in `ApiResponse<PetType>`.
    5. Catch all errors in a top-level try/catch; return `500` with `INTERNAL_ERROR`.
  - All responses must use the `ApiResponse<T>` envelope from `src/types/api.types.ts`.

- [x] **Task 12 — Middleware stub**
  - Create `middleware.ts` at the project root (alongside `next.config.ts`).
  - Match the `(main)` route group paths: protect `/pets/:path*`, `/dashboard/:path*`, `/requests/:path*`.
  - Read the auth token from cookies or `Authorization` header; redirect to `/login` if absent.
  - Add a `// TODO: verify JWT signature (auth spec)` comment — presence check only for now.
  - Export a `config` matcher that excludes `/api/`, `/_next/`, and static files.

- [x] **Task 13 — PetForm component**
  - Create `src/components/pets/PetForm.tsx` as a Client Component (`"use client"`).
  - Use `useForm<CreatePetInput>` from React Hook Form with `zodResolver(createPetSchema)`.
  - Render three semantic `<fieldset>` sections:
    1. **Basic info** — `name`, `species`, `breed`, `ageInMonths`, `sex`, `size`
    2. **Health & behavior** — `healthStatus`, `vaccinationStatus`, `sterilized`, `friendlyWithChildren`, `friendlyWithAnimals`
    3. **Location & description** — `city`, `state`, `description`
  - All enum fields use shadcn/ui `<Select>`; text fields use `<Input>`; long-text fields use `<Textarea>`.
  - Every field must have an accessible `<Label>` associated via `htmlFor`.
  - Inline error messages rendered below each field using `formState.errors`.
  - On submit: call `POST /api/pets`, handle loading state (`isSubmitting`), on success redirect to `/pets/[id]` using `useRouter`, on error show a global `<Alert>` above the submit button without clearing field values.
  - Display a character counter below `description` (e.g., "120 / 500").

- [x] **Task 14 — Registration page**
  - Create `src/app/(main)/pets/new/page.tsx` as a Server Component.
  - Export `metadata` with `title: "Register a pet — TTP"`.
  - Render a page heading and the `<PetForm />` component.
  - No data fetching needed at this stage.

- [x] **Task 15 — Dashboard link**
  - Add a "Register a pet" link/button to the dashboard page at `src/app/(main)/dashboard/page.tsx`.
  - If the dashboard page does not exist yet, create a minimal placeholder Server Component with the link pointing to `/pets/new`.

- [x] **Task 16 — Prisma seed (development data)**
  - Create `prisma/seed.ts` with at least two example `Pet` records (status `draft`) for local development and testing.
  - Add the `prisma.seed` script to `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }`.

- [x] **Task 17 — Build verification**
  - Run `npm run build` and confirm zero TypeScript errors and zero ESLint errors.
  - Run `npx prisma validate` to confirm the schema is valid.
  - Manually test the happy path locally:
    1. Start the dev server.
    2. Navigate to `/pets/new`.
    3. Submit an empty form — confirm all validation errors appear.
    4. Fill in valid data and submit — confirm redirect to `/pets/[id]`.
    5. Query the database to confirm the record exists with `status = draft`.

---

## Completion Checklist

Before marking this spec as done, verify:

- [x] All 14 form fields are present and functional.
- [x] Client-side validation matches server-side validation (same Zod schema).
- [x] A newly registered pet always has `status = draft`.
- [x] The `ownerId` on the created record matches the authenticated user's ID.
- [x] Unauthenticated access to `/pets/new` redirects to `/login`.
- [x] `POST /api/pets` with invalid body returns `400 VALIDATION_ERROR`.
- [x] No secrets or credentials are committed to source control.
- [x] No TypeScript `any` types are introduced.
- [x] All new components default to Server Components unless interactivity requires `"use client"`.
- [x] Build passes with zero errors.
