# Implementation Tasks — Adoption Request

## References
- #[[file:.kiro/specs/adoption-request/requirements.md]]
- #[[file:.kiro/specs/adoption-request/design.md]]

---

## Task Order Rationale

Tasks follow the bottom-up architecture:
**schema → types → repository → service → API routes → public components → owner components → pages → verification**

Public-side and owner-side are built in parallel once the data layer is ready.

---

## Tasks

- [x] **Task 1 — Prisma schema: AdoptionRequest model**
  - Add `AdoptionRequestStatus` enum (pending, accepted, rejected).
  - Add `AdoptionRequest` model with fields: id, petId (relation to Pet), applicantName, applicantEmail, message, status (default pending), createdAt, updatedAt.
  - Add indexes: `[petId]`, `[status]`, `[petId, applicantEmail]`.
  - No `@@unique` constraint — duplicate prevention is handled at the service layer.
  - Add `adoptionRequests AdoptionRequest[]` relation to the `Pet` model.
  - Run `npx prisma validate`.
  - Run `npx prisma migrate dev --name add-adoption-request`.
  - Run `npx prisma generate`.

- [x] **Task 2 — TypeScript types**
  - Create `types/adoption.types.ts` with:
    - `CreateAdoptionRequestInput` (petId, applicantName, applicantEmail, message)
    - `AdoptionRequestType` (full record)
    - `AdoptionRequestWithPet` (extended with petName, petId, petPrimaryImageUrl)

- [x] **Task 3 — Zod schemas**
  - Create `schemas/adoption.schema.ts` with:
    - `createAdoptionRequestSchema` — validates petId (min 1), applicantName (1–100), applicantEmail (email format), message (10–1000)
    - `updateRequestStatusSchema` — validates status as enum ["accepted", "rejected"]
  - Use Zod 4 API with error message constants.

- [x] **Task 4 — Adoption repository**
  - Create `repositories/adoption.repository.ts` with:
    - `create(data)` — insert AdoptionRequest
    - `findById(id)` — single lookup, include pet { ownerId }
    - `findPendingByPetAndEmail(petId, email)` — for duplicate check (where status = pending)
    - `findByOwnerPetsWithImages(ownerId)` — join through Pet where ownerId matches, include pet { id, name, images(order:0, take:1) }, order by createdAt desc
    - `updateStatus(id, status)` — update the status field
    - `rejectAllPendingForPet(petId, excludeId)` — bulk update pending → rejected, excluding one ID

- [x] **Task 5 — Adoption service**
  - Create `services/adoption.service.ts` with:
    - `createAdoptionRequest(input)`:
      1. Verify pet is published (findPublishedById)
      2. Check for duplicate pending (findPendingByPetAndEmail)
      3. Create request
    - `getRequestsForOwner(ownerId)`:
      1. Call findByOwnerPetsWithImages
      2. Map to AdoptionRequestWithPet (extract pet name + primary image URL)
    - `updateRequestStatus(requestId, status, ownerId)`:
      1. Find request with pet relation
      2. Verify ownership (pet.ownerId === ownerId)
      3. If accepting: update pet → adopted, reject all other pending, accept this one
      4. If rejecting: just update this one
  - Add `AdoptionServiceError` class.

- [x] **Task 6 — API: POST /api/adoption-requests**
  - Create `app/api/adoption-requests/route.ts`.
  - No auth required (public endpoint).
  - Validate body → call service → return 201.
  - Handle service errors: NOT_FOUND → 404, DUPLICATE → 400.
  - Standard ApiResponse envelope.

- [x] **Task 7 — API: PATCH /api/adoption-requests/[id]**
  - Create `app/api/adoption-requests/[id]/route.ts`.
  - Auth required.
  - Validate body with `updateRequestStatusSchema`.
  - Call `updateRequestStatus(id, status, user.id)`.
  - Handle NOT_FOUND → 404.
  - Standard ApiResponse envelope.

- [x] **Task 8 — AdoptionRequestForm (public)**
  - Create `components/catalog/AdoptionRequestForm.tsx` as Client Component.
  - Props: `{ petId: string }`.
  - Fields: applicant name, email, message.
  - Uses React Hook Form + zodResolver(createAdoptionRequestSchema).
  - On success: shows confirmation message (replaces form with success state).
  - No auth header (public endpoint).

- [x] **Task 9 — Public detail page integration**
  - Update `app/(public)/catalog/[id]/page.tsx` to render `<AdoptionRequestForm petId={pet.id} />` below the pet detail view.

- [x] **Task 10 — RequestCard component**
  - Create `components/adoption/RequestCard.tsx` as Server Component.
  - Props: `{ request: AdoptionRequestWithPet }`.
  - Displays: pet primary image thumbnail (small, using next/image), pet name, applicant name, email, message (truncated to 150 chars), formatted date, status badge.
  - Renders `<RequestActions>` only for pending requests.

- [x] **Task 11 — RequestActions component**
  - Create `components/adoption/RequestActions.tsx` as Client Component.
  - Props: `{ requestId: string, currentStatus: string }`.
  - Accept / Reject buttons (only shown if status is "pending").
  - Accept button includes confirmation: "This will mark the pet as adopted and reject all other pending requests. Continue?"
  - Calls `PATCH /api/adoption-requests/[id]` with `{ status: "accepted"|"rejected" }`.
  - Shows loading state during API call.
  - Refreshes page on success via `router.refresh()`.

- [x] **Task 12 — RequestList component**
  - Create `components/adoption/RequestList.tsx` as Server Component.
  - Props: `{ requests: AdoptionRequestWithPet[] }`.
  - Maps to `<RequestCard>` for each.
  - Empty state: "No adoption requests yet. Your published pets will receive requests from potential adopters."

- [x] **Task 13 — Requests inbox page**
  - Create `app/(main)/requests/page.tsx` as async Server Component.
  - Fetches `getRequestsForOwner(user.id)` via getCurrentUserFromCookies.
  - Renders heading + `<RequestList>`.
  - Export metadata: `{ title: "Adoption Requests" }`.

- [x] **Task 14 — Requests loading state**
  - Create `app/(main)/requests/loading.tsx`.
  - Skeleton cards matching RequestCard layout.

- [x] **Task 15 — Requests error state**
  - Create `app/(main)/requests/error.tsx` as Client Component.
  - Standard error boundary pattern.

- [x] **Task 16 — Navigation update**
  - Add "Requests" link to the `app/(main)/layout.tsx` nav (alongside Dashboard and Register pet).

- [x] **Task 17 — Build verification**
  - Run `npx prisma validate`.
  - Run `npx tsc --noEmit`.
  - Run `npm run build`.
  - Verify all new routes appear in the build output.
  - Test:
    1. Submit adoption request from `/catalog/[id]` → stored with status pending.
    2. See it appear in owner's `/requests` inbox with pet image.
    3. Accept request → pet becomes adopted, other pending requests rejected.
    4. Duplicate pending request → rejected with 400.
    5. Request for draft pet → rejected with 404.
    6. Pet disappears from catalog after adoption.

---

## Completion Checklist

Before marking this spec as done, verify:

- [ ] Adoption request form renders on public detail page.
- [ ] Validation works client-side and server-side.
- [ ] Only published pets accept requests.
- [ ] Duplicate pending requests are rejected (service layer).
- [ ] Owner inbox shows requests with pet name and primary image.
- [ ] Accept cascades: request → accepted, pet → adopted, others → rejected.
- [ ] Reject only affects one request (no cascade).
- [ ] Adopted pet no longer appears in catalog.
- [ ] Owner cannot see other owners' requests.
- [ ] No ownerId exposed publicly.
- [ ] No N+1 queries in the inbox (single query with includes).
- [ ] Loading/error states present on all new pages.
- [ ] No TypeScript `any` types introduced.
- [ ] All API responses use standard envelope.
- [ ] Build passes with zero errors.
