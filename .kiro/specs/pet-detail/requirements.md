# Requirements — Pet Detail Page

## Overview

This specification covers the pet detail page at `/pets/[id]`, which displays the full profile of a registered pet to its owner. This is the page the rescuer sees after successfully registering a pet, and the primary place to review pet information before publishing to the public catalog.

**Out of scope for this spec:**
- Editing pet data (separate edit spec)
- AI-generated description (separate spec)
- Photo gallery / image display (separate spec)
- Public-facing pet profile at `/catalog/[id]` (separate spec)
- Publishing workflow (draft → published status change)

---

## Functional Requirements

### FR-01 — Route Structure
The pet detail page must be accessible at `/pets/[id]` where `[id]` is the pet's unique CUID identifier.

### FR-02 — Access Control
The page must only be accessible to authenticated users. Unauthenticated users must be redirected to `/login` (handled by middleware, already implemented).

### FR-03 — Ownership Check
The page must verify that the authenticated user is the owner of the pet being viewed. If the pet exists but belongs to a different user, the page must return a 404 (not-found) to avoid leaking information about other users' pets.

### FR-04 — Data Fetching
The page must fetch the full pet record from the database using the `id` URL parameter, through the service → repository layered architecture.

### FR-05 — Not Found Handling
If no pet with the given `id` exists in the database, the page must render a user-friendly "Pet not found" message with a link back to the dashboard. The HTTP response must be a 404.

### FR-06 — Loading State
While data is being fetched, the page must show a loading skeleton or spinner to provide immediate visual feedback.

### FR-07 — Error State
If an unexpected error occurs during data fetching, the page must show a user-friendly error message with a retry option. The error must not expose internal details (stack traces, SQL, etc.).

### FR-08 — Information Display
The page must display all fields from the `Pet` model in a structured, readable layout:
- Pet name (as page heading)
- Species and breed
- Estimated age (formatted as years and months)
- Sex
- Size
- Health status
- Vaccination status
- Sterilization status
- Friendly with children
- Friendly with other animals
- Short description
- City and state (location)
- Current status (draft/published/adopted) as a badge
- Registration date (createdAt, formatted)

### FR-09 — Status Badge
The pet's status must be rendered as a visible badge:
- `draft` — gray/neutral badge with label "Draft"
- `published` — green badge with label "Published"
- `adopted` — blue badge with label "Adopted"

### FR-10 — Navigation
The page must include:
- A breadcrumb: Dashboard → My Pets → Pet Name
- A link back to the dashboard
- A link to the edit page (`/pets/[id]/edit`) — rendered but non-functional until the edit spec is implemented

### FR-11 — Metadata
The page must set a dynamic `<title>` based on the pet name (e.g., "Luna — TTP").

---

## User Stories

### US-01 — View pet profile after registration
> **As a** rescuer,  
> **I want to** see the full details of a pet I just registered,  
> **so that** I can review the information before deciding to add photos or publish.

### US-02 — Confirm data is correct
> **As a** rescuer,  
> **I want to** see all the data I entered during registration displayed clearly,  
> **so that** I can verify nothing was lost or misformatted.

### US-03 — See pet not found when using invalid link
> **As a** user,  
> **I want to** see a clear message when I navigate to a pet that doesn't exist,  
> **so that** I know the link is broken and can navigate back to my dashboard.

### US-04 — See loading feedback
> **As a** rescuer,  
> **I want to** see immediate visual feedback when the page is loading,  
> **so that** I know the application is working and not frozen.

---

## Acceptance Criteria

### AC-01 — Page renders pet data
- **Given** an authenticated user owns a pet with id `abc123`,
- **When** they navigate to `/pets/abc123`,
- **Then** all 14 data fields from the Pet model are displayed on the page.

### AC-02 — Dynamic page title
- **Given** a pet named "Luna",
- **When** the page loads,
- **Then** the browser tab shows "Luna — TTP".

### AC-03 — Not found for missing ID
- **Given** no pet exists with id `nonexistent`,
- **When** the user navigates to `/pets/nonexistent`,
- **Then** a 404 page is shown with a message "Pet not found" and a link to `/dashboard`.

### AC-04 — Not found for another user's pet
- **Given** pet `xyz789` belongs to user B,
- **When** user A navigates to `/pets/xyz789`,
- **Then** a 404 page is shown (same behavior as missing pet — no ownership leak).

### AC-05 — Loading state appears
- **Given** the page is loading data,
- **When** the fetch is in progress,
- **Then** a loading skeleton is visible in place of the pet content.

### AC-06 — Error state renders gracefully
- **Given** a database error occurs during the fetch,
- **When** the page catches the error,
- **Then** a user-friendly error message is shown without technical details.

### AC-07 — Status badge displays correctly
- **Given** a pet with `status: "draft"`,
- **When** the page renders,
- **Then** a neutral-colored "Draft" badge is visible next to the pet's name.

### AC-08 — Age is human-readable
- **Given** a pet with `ageInMonths: 18`,
- **When** the page renders the age,
- **Then** it displays "1 year, 6 months" (not "18 months").

### AC-09 — Breadcrumb navigation
- **Given** the page is loaded,
- **When** the user sees the breadcrumb,
- **Then** it shows "Dashboard / My Pets / Luna" with working links.

### AC-10 — Edit link present
- **Given** the page is loaded,
- **When** the user looks for edit functionality,
- **Then** an "Edit" button/link is visible pointing to `/pets/[id]/edit`.
