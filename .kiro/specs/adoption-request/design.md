# Technical Design — Adoption Request

## References
- #[[file:.kiro/steering/product.md]]
- #[[file:.kiro/steering/tech.md]]
- #[[file:.kiro/steering/structure.md]]
- #[[file:.kiro/specs/public-pet-catalog/design.md]]
- #[[file:.kiro/specs/pet-detail/design.md]]

---

## Architecture Overview

The adoption request feature spans two contexts:

```
PUBLIC (no auth):
  /catalog/[id] → AdoptionRequestForm (Client Component)
    └── POST /api/adoption-requests (Route Handler)
          └── createAdoptionRequest() — services/adoption.service.ts
                └── adoptionRepository.create()

OWNER (auth required):
  /requests → Requests inbox (Server Component)
    └── getRequestsForOwner() — services/adoption.service.ts
          └── adoptionRepository.findByOwnerPetsWithImages()

  PATCH /api/adoption-requests/[id] → updateRequestStatus()
    └── adoptionRepository.updateStatus()
    └── petRepository.update() (when accepting → set pet to adopted)
    └── adoptionRepository.rejectAllPendingForPet() (when accepting → reject others)
```

---

## Data Model

### Prisma Schema — `AdoptionRequest`

```prisma
enum AdoptionRequestStatus {
  pending
  accepted
  rejected
}

model AdoptionRequest {
  id             String                 @id @default(cuid())
  petId          String
  pet            Pet                    @relation(fields: [petId], references: [id], onDelete: Cascade)
  applicantName  String
  applicantEmail String
  message        String
  status         AdoptionRequestStatus  @default(pending)
  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt

  @@index([petId])
  @@index([status])
  @@index([petId, applicantEmail])
}
```

Update `Pet` model to add the relation:
```prisma
model Pet {
  // ... existing fields ...
  adoptionRequests  AdoptionRequest[]
}
```

**Design decisions:**
- **No `@@unique` constraint** — allows multiple historical requests from the same email for the same pet (e.g., rejected then resubmitted). Duplicate prevention for _pending_ requests is enforced at the service layer.
- **`@@index([petId, applicantEmail])`** — optimizes the service-layer duplicate check query.
- `onDelete: Cascade` — requests are cleaned up if a pet is deleted.
- No `userId` on the request — adopters don't need accounts in the MVP.

---

## TypeScript Types

### `types/adoption.types.ts`

```ts
export type CreateAdoptionRequestInput = {
  petId: string;
  applicantName: string;
  applicantEmail: string;
  message: string;
};

export type AdoptionRequestType = {
  id: string;
  petId: string;
  applicantName: string;
  applicantEmail: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

/** Extended type for the owner's inbox — includes pet details for display. */
export type AdoptionRequestWithPet = AdoptionRequestType & {
  petName: string;
  petId: string;
  petPrimaryImageUrl: string | null;
};
```

---

## Zod Schemas

### `schemas/adoption.schema.ts`

```ts
export const createAdoptionRequestSchema = z.object({
  petId: z.string().min(1),
  applicantName: z.string().min(1).max(100),
  applicantEmail: z.string().email(),
  message: z.string().min(10).max(1000),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});
```

---

## Repository Layer

### `repositories/adoption.repository.ts`

```ts
export const adoptionRepository = {
  async create(data: CreateAdoptionRequestInput): Promise<AdoptionRequest>

  async findById(id: string): Promise<AdoptionRequest | null>

  async findPendingByPetAndEmail(petId: string, email: string): Promise<AdoptionRequest | null>
    // WHERE petId = X AND applicantEmail = Y AND status = 'pending'

  async findByOwnerPetsWithImages(ownerId: string): Promise<...>
    // Joins through Pet (where pet.ownerId = ownerId)
    // Includes: pet { name, images(where: { order: 0 }, take: 1) }
    // Orders by createdAt desc
    // Single query — no N+1

  async updateStatus(id: string, status: "accepted" | "rejected"): Promise<AdoptionRequest>

  async rejectAllPendingForPet(petId: string, excludeId: string): Promise<void>
    // UPDATE AdoptionRequest SET status = 'rejected' WHERE petId = X AND status = 'pending' AND id != excludeId
}
```

**Key design:** `findByOwnerPetsWithImages` uses Prisma's nested include to load pet name + primary image in a single query:
```ts
prisma.adoptionRequest.findMany({
  where: { pet: { ownerId } },
  include: {
    pet: {
      select: { id: true, name: true, images: { where: { order: 0 }, take: 1 } }
    }
  },
  orderBy: { createdAt: "desc" },
})
```

---

## Service Layer

### `services/adoption.service.ts`

```ts
async function createAdoptionRequest(input: CreateAdoptionRequestInput): Promise<AdoptionRequestType>
  // 1. Verify pet exists AND status = "published" (use findPublishedById)
  // 2. Check for duplicate: findPendingByPetAndEmail(petId, email)
  //    → throw DUPLICATE if found
  // 3. Create the request with status = pending

async function getRequestsForOwner(ownerId: string): Promise<AdoptionRequestWithPet[]>
  // 1. Call findByOwnerPetsWithImages(ownerId)
  // 2. Map results to AdoptionRequestWithPet (extract pet name + primary image URL)

async function updateRequestStatus(
  requestId: string,
  status: "accepted" | "rejected",
  ownerId: string
): Promise<AdoptionRequestType>
  // 1. Find the request (with pet relation)
  // 2. Verify request.pet.ownerId === ownerId → throw NOT_FOUND if not
  // 3. If status === "accepted":
  //    a. Update pet status to "adopted" (petRepository.update)
  //    b. Reject all other pending requests (adoptionRepository.rejectAllPendingForPet)
  //    c. Update this request to "accepted"
  // 4. If status === "rejected":
  //    a. Update this request to "rejected" (no cascade)
```

Error class: `AdoptionServiceError` with `code` field (pattern: `NOT_FOUND`, `DUPLICATE`, `VALIDATION_ERROR`).

---

## API Routes

### `POST /api/adoption-requests`

**No auth required.** Public endpoint.

- Validate body with `createAdoptionRequestSchema`.
- Call `createAdoptionRequest(data)`.
- Return 201 on success with `ApiResponse<AdoptionRequestType>`.
- Return 404 if pet not found/not published.
- Return 400 if duplicate pending request.

### `PATCH /api/adoption-requests/[id]`

**Auth required.** Owner endpoint.

- Validate body with `updateRequestStatusSchema`.
- Call `updateRequestStatus(id, status, user.id)`.
- Return 200 on success with `ApiResponse<AdoptionRequestType>`.
- Return 404 if request not found or not owned.

---

## Component Structure

### Public Side

#### `components/catalog/AdoptionRequestForm.tsx`
- **Type:** Client Component (`"use client"`)
- Props: `{ petId: string }`
- Fields: applicant name, email, message
- Uses React Hook Form + Zod resolver
- Shows success state after submission (replaces form with confirmation message)
- No auth header needed (public endpoint)

Integration: Rendered at the bottom of `/catalog/[id]` page.

### Owner Side

#### `components/adoption/RequestCard.tsx`
- Server Component
- Props: `{ request: AdoptionRequestWithPet }`
- Displays: pet primary image thumbnail, pet name, applicant name, email, message excerpt (truncated), date, status badge
- Renders `<RequestActions>` for pending requests only

#### `components/adoption/RequestActions.tsx`
- Client Component (`"use client"`)
- Props: `{ requestId: string, currentStatus: string }`
- Accept/Reject buttons (only visible if status is "pending")
- Accept button shows a confirmation prompt ("This will mark the pet as adopted and reject all other pending requests.")
- Calls `PATCH /api/adoption-requests/[id]` on click
- Shows loading state during API call
- Refreshes the page on success via `router.refresh()`

#### `components/adoption/RequestList.tsx`
- Server Component
- Props: `{ requests: AdoptionRequestWithPet[] }`
- Renders list of `<RequestCard>` components
- Empty state: "No adoption requests yet. Your published pets will receive requests from potential adopters."

---

## Pages

### `/requests` (owner inbox)
- `app/(main)/requests/page.tsx` — async Server Component
- Fetches `getRequestsForOwner(user.id)`
- Renders heading + `<RequestList>`
- Loading/error states as sibling files

### `/catalog/[id]` (updated)
- Add `<AdoptionRequestForm petId={pet.id} />` at the bottom of the existing page

---

## File Map

```
prisma/
  schema.prisma                                 ← Add AdoptionRequest model + enum + Pet relation

types/
  adoption.types.ts                             ← New

schemas/
  adoption.schema.ts                            ← New

repositories/
  adoption.repository.ts                        ← New

services/
  adoption.service.ts                           ← New

app/
  api/
    adoption-requests/
      route.ts                                  ← POST (public)
      [id]/
        route.ts                                ← PATCH (auth)
  (main)/
    requests/
      page.tsx                                  ← Owner inbox
      loading.tsx
      error.tsx
    layout.tsx                                  ← Add "Requests" nav link
  (public)/
    catalog/
      [id]/
        page.tsx                                ← Add AdoptionRequestForm

components/
  catalog/
    AdoptionRequestForm.tsx                     ← Client Component (public form)
  adoption/
    RequestCard.tsx                             ← Server Component
    RequestActions.tsx                          ← Client Component (accept/reject)
    RequestList.tsx                             ← Server Component
```

---

## Accept Cascade — Detailed Flow

When an owner accepts a request:

```
1. PATCH /api/adoption-requests/:id { status: "accepted" }
2. Service layer:
   a. Verify ownership (request.pet.ownerId === user.id)
   b. petRepository.update(pet.id, { ...currentPetData, status: "adopted" })
   c. adoptionRepository.rejectAllPendingForPet(pet.id, excludeId: request.id)
   d. adoptionRepository.updateStatus(request.id, "accepted")
3. Result: pet = adopted, accepted request = accepted, all others = rejected
```

After this cascade:
- The pet disappears from the public catalog (status !== "published").
- No new requests can be submitted (pet is no longer published).
- The owner sees the accepted request highlighted in their inbox.

---

## Security Considerations

- **No auth on request creation:** Intentional for MVP. Adopters don't need accounts.
- **Duplicate prevention at service layer:** Checks for existing pending request with same email + petId. Allows re-submission after rejection.
- **Owner isolation:** `findByOwnerPetsWithImages` joins through `Pet.ownerId`. An owner can never see requests for other owners' pets.
- **Status update ownership:** Before updating a request's status, the service loads the request with its pet relation and verifies `pet.ownerId === ownerId`.
- **Published-only:** Request creation verifies `pet.status === "published"` via `findPublishedById`.
- **Accept cascade is atomic:** All three operations (pet update, reject others, accept this one) should ideally be in a transaction. For MVP, they're sequential — a Prisma `$transaction` can wrap them for production hardening.
