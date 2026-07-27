# Requirements — Public Pet Catalog

## Overview

This specification implements the public-facing adoption catalog. Visitors (authenticated or not) can browse pets that rescuers have published for adoption and view detailed profiles. This is the primary discovery surface for potential adopters.

**Out of scope:**
- Adoption request submission (separate spec)
- Search, filtering, and pagination (future optimization)
- Favorites or saved pets
- Messaging between adopters and rescuers
- Authentication changes
- Any owner management actions (edit, upload, delete)

---

## Functional Requirements

### FR-01 — Public Catalog Page
The system must provide a public catalog page at `/catalog` accessible without authentication.

### FR-02 — Published Pets Only
The catalog must display only pets with `status = "published"`. Pets with `draft` or `adopted` status must never appear.

### FR-03 — Responsive Card Grid
Published pets must be displayed as cards in a responsive grid:
- 1 column on mobile (< 640px)
- 2 columns on tablet (640px–1024px)
- 3 columns on desktop (≥ 1024px)

### FR-04 — Public Pet Card Content
Each card must display:
- Primary image (order 0) or placeholder if no images exist
- Pet name
- Species
- Breed
- Age (human-readable format)
- City and state
- "View details" link → `/catalog/[id]`

### FR-05 — Public Pet Detail Page
The system must provide a public detail page at `/catalog/[id]` that displays the full public profile of a published pet.

### FR-06 — Public Detail Content
The detail page must display:
- Photo gallery (reusing `PetImageGallery`)
- Pet name
- Species and breed
- Age (formatted)
- Sex
- Size
- Description
- Health status
- Vaccination status
- Sterilization status
- Friendly with children
- Friendly with other animals
- City and state

### FR-07 — Information Security
The public pages must NOT expose:
- `ownerId`
- Internal database IDs in visible UI (CUIDs in URLs are acceptable)
- Edit actions or links
- Upload/delete functionality
- Management controls of any kind

### FR-08 — Not Found Handling
If a pet with the given ID does not exist or is not published, the detail page must return a 404 with a user-friendly "Pet not found" message and a link back to the catalog.

### FR-09 — Loading States
Both the catalog page and the detail page must display loading skeletons while data is being fetched.

### FR-10 — Error States
Both pages must show a user-friendly error message with a retry option if an unexpected error occurs during data fetching.

### FR-11 — Empty Catalog State
If no pets are currently published, the catalog must display a friendly empty state message (e.g., "No pets available for adoption right now. Check back soon!").

### FR-12 — No Authentication Required
The catalog and detail pages must be accessible without any authentication. The middleware must exclude `/catalog` routes from auth protection (already configured).

### FR-13 — Ordering
The catalog must display pets ordered by most recently published (newest first). Since there's no `publishedAt` field yet, use `updatedAt` descending as proxy.

---

## User Stories

### US-01 — Browse available pets
> **As a** potential adopter,  
> **I want to** browse pets available for adoption,  
> **so that** I can find a pet that might be right for me.

### US-02 — View pet profile
> **As a** potential adopter,  
> **I want to** see detailed information about a specific pet,  
> **so that** I can decide if this pet is a good match before contacting the rescuer.

### US-03 — See photos
> **As a** potential adopter,  
> **I want to** see multiple photos of a pet,  
> **so that** I can see what the pet looks like from different angles.

### US-04 — Know location
> **As a** potential adopter,  
> **I want to** see where the pet is located,  
> **so that** I can determine if adoption is geographically feasible.

---

## Acceptance Criteria

### AC-01 — Only published pets appear
- **Given** 3 pets exist: 1 draft, 1 published, 1 adopted,
- **When** a visitor opens `/catalog`,
- **Then** only the 1 published pet is displayed.

### AC-02 — Card shows correct information
- **Given** a published pet with name "Luna", species "dog", breed "Labrador",
- **When** the catalog renders,
- **Then** the card shows "Luna", "Dog", "Labrador", age, location, and a "View details" link.

### AC-03 — Primary image on card
- **Given** a published pet with images at order 0, 1, 2,
- **When** the card renders,
- **Then** only the order-0 image appears as the card thumbnail.

### AC-04 — Placeholder for imageless pets
- **Given** a published pet with no images,
- **When** the card renders,
- **Then** a placeholder icon is shown.

### AC-05 — Detail page shows all public fields
- **Given** a published pet,
- **When** a visitor opens `/catalog/[id]`,
- **Then** all fields from FR-06 are displayed.

### AC-06 — Detail page shows photo gallery
- **Given** a published pet with 3 images,
- **When** the detail page renders,
- **Then** the `PetImageGallery` displays the primary + secondary images.

### AC-07 — Draft pet returns 404
- **Given** a pet with status "draft",
- **When** a visitor navigates to `/catalog/[id]`,
- **Then** a 404 page is shown.

### AC-08 — No edit/management controls visible
- **Given** the public detail page,
- **When** it renders,
- **Then** there are no Edit links, Upload buttons, or Delete buttons anywhere on the page.

### AC-09 — Empty catalog state
- **Given** zero published pets,
- **When** a visitor opens `/catalog`,
- **Then** the empty state message is displayed.

### AC-10 — No auth required
- **Given** a visitor without an auth cookie,
- **When** they navigate to `/catalog` or `/catalog/[id]`,
- **Then** the pages load normally without redirect to login.
