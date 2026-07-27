# Requirements — Adoption Request

## Overview

This specification implements the first adoption interaction flow in TTP. Visitors browsing the public catalog can submit an adoption request for a published pet. Pet owners receive these requests in their dashboard and can accept or reject them.

**Out of scope:**
- User accounts for adopters (requests are anonymous / email-based for MVP)
- Email notifications to owner or applicant
- Messaging between owner and applicant
- Payment or legal adoption processes
- Rate limiting on request submissions

---

## Functional Requirements

### Public Side — Request Submission

#### FR-01 — Adoption Request Form
The public pet detail page (`/catalog/[id]`) must include an "Request Adoption" action that opens or reveals a form.

#### FR-02 — Form Fields
The adoption request form must collect:
- **Applicant name** — required, 1–100 characters
- **Applicant email** — required, valid email format
- **Message** — required, 10–1000 characters (why you want to adopt)

#### FR-03 — Only Published Pets
Adoption requests can only be submitted for pets with `status = "published"`. The API must reject requests for draft or adopted pets.

#### FR-04 — Client-Side Validation
All fields must be validated before submission with clear inline error messages.

#### FR-05 — Server-Side Validation
The API must independently validate all input with Zod schemas and return structured error responses.

#### FR-06 — Success Feedback
After a successful submission, show a confirmation message: "Your adoption request has been sent! The rescuer will contact you by email."

#### FR-07 — No Authentication Required
Adoption request submission does not require login. Anyone can submit a request.

#### FR-08 — Duplicate Prevention
A visitor cannot submit more than one pending request for the same pet with the same email address. The service layer checks for an existing pending request and rejects duplicates with a clear message. This is enforced at the application level, not via a database constraint, to allow historical (accepted/rejected) requests from the same email.

### Owner Side — Request Management

#### FR-09 — Requests Inbox
The owner must have a way to view adoption requests for their pets. A new route `/requests` within the authenticated area shows all requests, each displaying the associated pet name and primary image.

#### FR-10 — Request Details
Each request displays: applicant name, email, message, submission date, pet name, pet primary image, and current status.

#### FR-11 — Accept Request (with cascade)
When the owner accepts a request:
1. The request status changes to `accepted`.
2. The pet's status is automatically set to `adopted`.
3. All other pending requests for the same pet are automatically rejected.

This ensures a single accepted request per pet and a clean state transition.

#### FR-12 — Reject Request
The owner can mark a request as "rejected". This changes only that request's status to `rejected`. No other side effects.

#### FR-13 — Ownership Enforcement
Owners can only view and manage requests for pets they own. The API must verify ownership on every operation.

#### FR-14 — Request Ordering
Requests are ordered by submission date, newest first.

---

## User Stories

### US-01 — Submit adoption request
> **As a** potential adopter,  
> **I want to** submit a request for a pet I'm interested in,  
> **so that** the rescuer knows I want to adopt.

### US-02 — See confirmation
> **As a** potential adopter,  
> **I want to** see a confirmation after submitting my request,  
> **so that** I know it was received successfully.

### US-03 — View incoming requests
> **As a** rescuer,  
> **I want to** see all adoption requests for my pets with their photos,  
> **so that** I can review interested adopters.

### US-04 — Accept a request
> **As a** rescuer,  
> **I want to** accept a request, which automatically marks the pet as adopted and rejects other pending requests,  
> **so that** the adoption is finalized cleanly.

### US-05 — Reject a request
> **As a** rescuer,  
> **I want to** reject requests that aren't a good fit,  
> **so that** I can manage my inbox and focus on suitable adopters.

---

## Acceptance Criteria

### AC-01 — Form renders on public detail page
- **Given** a published pet at `/catalog/[id]`,
- **When** the page loads,
- **Then** an "Request Adoption" button or form is visible.

### AC-02 — Successful submission
- **Given** valid form data (name, email, message),
- **When** the visitor submits the request,
- **Then** a success confirmation is displayed and the request is stored with status "pending".

### AC-03 — Draft pet rejection
- **Given** a pet with status "draft",
- **When** a request is submitted via API,
- **Then** the API returns 404 (pet not found / not published).

### AC-04 — Duplicate prevention
- **Given** a pending request already exists for pet X from email "a@b.com",
- **When** the same email submits another request for pet X,
- **Then** the API returns 400 with "You already have a pending request for this pet".

### AC-05 — Owner sees requests with pet info
- **Given** a rescuer with 2 pets, each having 3 requests,
- **When** they visit `/requests`,
- **Then** all 6 requests are displayed with pet names, primary images, and statuses.

### AC-06 — Accept cascades correctly
- **Given** pet X has 3 pending requests (A, B, C),
- **When** the owner accepts request A,
- **Then** A status = "accepted", B and C status = "rejected", and pet X status = "adopted".

### AC-07 — Reject only affects one request
- **Given** a pending request,
- **When** the owner clicks "Reject",
- **Then** only that request's status changes to "rejected". The pet and other requests are unchanged.

### AC-08 — Cross-user access blocked
- **Given** owner A tries to view or manage owner B's requests,
- **When** the API processes the request,
- **Then** it returns only owner A's data (empty if none, or 404 for specific request operations).

### AC-09 — Adopted pet no longer accepts requests
- **Given** a pet whose status was changed to "adopted" (via accept cascade),
- **When** a visitor tries to submit a new request for that pet,
- **Then** the API returns 404 (not published).
