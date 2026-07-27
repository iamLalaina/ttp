# Technical Design — Pet Detail Page

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/pet-registration/design.md]]

---

## Architecture Overview

The pet detail page follows the established unidirectional layered architecture:

```
Page (Server Component) — app/(main)/pets/[id]/page.tsx
  └── getPetById() — services/pet.service.ts
        └── petRepository.findById() — repositories/pet.repository.ts
              └── prisma.pet.findUnique() — PostgreSQL via Prisma
```

This page is a **Server Component** by default — no client-side data fetching. The entire flow is server-rendered, with `loading.tsx` providing instant feedback while the async page resolves.

---

## Data Flow

1. Next.js App Router invokes `page.tsx` with `params.id`.
2. The page calls `getCurrentUser(req)` to get the authenticated user's ID.
3. The page calls `getPetByIdForOwner(id, ownerId)` from the service layer.
4. The service delegates to `petRepository.findById(id)`.
5. The service verifies `pet.ownerId === ownerId` (ownership check).
6. If the pet is not found or ownership fails → call `notFound()` from `next/navigation`.
7. If the pet is found and owned → render the detail view.

---

## Repository Layer — Extensions

### `repositories/pet.repository.ts`

Add a `findById` method to the existing repository:

```ts
async findById(id: string): Promise<Pet | null> {
  return prisma.pet.findUnique({ where: { id } });
}
```

This method returns the full `Pet` record or `null` if no record matches. No filtering by status — the owner can view any of their pets regardless of status.

---

## Service Layer — Extensions

### `services/pet.service.ts`

Add a `getPetByIdForOwner` function:

```ts
async function getPetByIdForOwner(id: string, ownerId: string): Promise<PetType | null> {
  const pet = await petRepository.findById(id);
  
  if (!pet) return null;
  if (pet.ownerId !== ownerId) return null; // Ownership guard
  
  return pet as PetType;
}
```

**Design decision:** Returns `null` for both "not found" and "wrong owner" cases. This prevents leaking information about other users' pets through different error responses.

---

## Page Component

### `app/(main)/pets/[id]/page.tsx`

**Type:** Server Component (async function)

**Props:** `{ params: Promise<{ id: string }> }` (Next.js 15 dynamic params are async)

**Metadata:** Dynamic — uses `generateMetadata` to set the title based on the pet's name.

**Flow:**
1. Await `params` to extract `id`.
2. Call auth helper to get current user.
3. Call `getPetByIdForOwner(id, user.id)`.
4. If result is null → call `notFound()`.
5. Otherwise → render `<PetDetailView pet={pet} />`.

```ts
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/cognito";
import { getPetByIdForOwner } from "@/services/pet.service";
import { PetDetailView } from "@/components/pets/PetDetailView";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  // Lightweight fetch just for title — could be optimized with cache
  const pet = await getPetByIdForOwner(id, /* user id from auth */);
  return { title: pet ? pet.name : "Pet not found" };
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser(/* request context */);
  if (!user) notFound();
  
  const pet = await getPetByIdForOwner(id, user.id);
  if (!pet) notFound();
  
  return <PetDetailView pet={pet} />;
}
```

**Note on auth in Server Components:** Since this page is inside the `(main)` route group, middleware has already validated the token. However, we still need the user's `id` for the ownership check. The `getCurrentUser` helper will need an adaptation for Server Components that reads from cookies/headers in the request context.

---

## Loading State

### `app/(main)/pets/[id]/loading.tsx`

A skeleton placeholder matching the detail view layout:

```tsx
export default function PetDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />  {/* Name */}
      <div className="h-4 w-24 rounded bg-muted" />  {/* Status badge */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-6 rounded bg-muted" />
        ))}
      </div>
      <div className="h-24 rounded bg-muted" />      {/* Description */}
    </div>
  );
}
```

---

## Not Found State

### `app/(main)/pets/[id]/not-found.tsx`

Displayed when `notFound()` is called. Shows a friendly message with a link back:

```tsx
import Link from "next/link";

export default function PetNotFound() {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-2xl font-bold">Pet not found</h1>
      <p className="text-muted-foreground">
        The pet you're looking for doesn't exist or you don't have access to it.
      </p>
      <Link href="/dashboard" className="text-primary underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
```

---

## Error State

### `app/(main)/pets/[id]/error.tsx`

A Client Component (required by Next.js error boundaries) that displays a user-friendly error with a retry button:

```tsx
"use client";

export default function PetDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">
        We couldn't load this pet's information. Please try again.
      </p>
      <button onClick={reset} className="text-primary underline">
        Try again
      </button>
    </div>
  );
}
```

---

## PetDetailView Component

### `components/pets/PetDetailView.tsx`

**Type:** Server Component (no `"use client"`)

**Props:** `{ pet: PetType }`

**Structure:**
- Header section: pet name, status badge, edit link
- Info grid: structured display of all fields
- Description section: full text display
- Footer: creation date, breadcrumb navigation

**Field display mapping:**

| Field | Display format |
|---|---|
| `name` | H1 heading |
| `species` | Capitalized: "Dog" or "Cat" |
| `breed` | Plain text |
| `ageInMonths` | Human-readable: "1 year, 6 months" via `formatAge()` |
| `sex` | Capitalized: "Male" or "Female" |
| `size` | Capitalized: "Small", "Medium", "Large" |
| `healthStatus` | Multi-line text block |
| `vaccinationStatus` | Mapped: "up_to_date" → "Up to date", "partial" → "Partial", "unknown" → "Unknown" |
| `sterilized` | "Yes", "No", or "Unknown" |
| `friendlyWithChildren` | "Yes", "No", or "Unknown" |
| `friendlyWithAnimals` | "Yes", "No", or "Unknown" |
| `description` | Full text paragraph |
| `city` + `state` | Combined: "Buenos Aires, CABA" |
| `status` | Color-coded badge |
| `createdAt` | Formatted date: "Jul 27, 2026" |

---

## Utility Functions

### `utils/format.ts`

New utility functions needed:

```ts
/**
 * Converts an age in months to a human-readable string.
 * Examples:
 *   formatAge(18) → "1 year, 6 months"
 *   formatAge(3) → "3 months"
 *   formatAge(24) → "2 years"
 */
function formatAge(ageInMonths: number): string

/**
 * Formats a Date into a localized short date string.
 * Example: formatDate(new Date("2026-07-27")) → "Jul 27, 2026"
 */
function formatDate(date: Date): string

/**
 * Capitalizes the first letter of a string.
 * Example: capitalize("dog") → "Dog"
 */
function capitalize(str: string): string

/**
 * Maps enum values to human-readable labels.
 * Example: formatEnumLabel("up_to_date") → "Up to date"
 */
function formatEnumLabel(value: string): string
```

---

## Auth in Server Components — Adaptation

The current `getCurrentUser` accepts a `NextRequest` object (available in Route Handlers and middleware). In a Server Component, there's no `NextRequest` — instead we use `cookies()` and `headers()` from `next/headers`.

A new helper is needed:

### `lib/cognito.ts` — add `getCurrentUserFromCookies`

```ts
import { cookies, headers } from "next/headers";

async function getCurrentUserFromCookies(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!token) return null;
  
  // TODO: verify JWT signature (auth spec)
  return { id: "stub-user-id" };
}
```

This function reads auth tokens from the request cookies in Server Component context without requiring a `NextRequest` parameter.

---

## File Map

```
app/
  (main)/
    pets/
      [id]/
        page.tsx            ← Pet detail Server Component
        loading.tsx         ← Loading skeleton
        not-found.tsx       ← Not-found state
        error.tsx           ← Error boundary (Client Component)

components/
  pets/
    PetDetailView.tsx       ← Presentational Server Component

services/
  pet.service.ts            ← Add getPetByIdForOwner()

repositories/
  pet.repository.ts         ← Add findById()

utils/
  format.ts                 ← New utility functions

lib/
  cognito.ts                ← Add getCurrentUserFromCookies()
```

---

## Styling Approach

- Uses Tailwind utility classes — no new CSS files.
- Status badge uses `class-variance-authority` for variant styling (reuses shadcn patterns).
- Layout uses a responsive grid for the info fields (2 columns on md+, 1 column on mobile).
- Loading skeleton uses `animate-pulse` with `bg-muted` blocks matching the content layout.
