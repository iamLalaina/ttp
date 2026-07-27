# Requirements — Dashboard Pet Listing

## Overview

This specification replaces the current placeholder on the `/dashboard` page with a fully functional pet listing that shows all pets owned by the authenticated user. Each pet is displayed as a responsive card with its primary photo, key information, and action links to view or edit.

**Out of scope:**
- Pagination or infinite scroll (future optimization — the MVP targets ≤50 pets per user)
- Search or filtering within the user's own pets
- Bulk actions (delete multiple, publish multiple)
- Adoption requests inbox (separate spec)

---

## Functional Requirements

### FR-01 — Fetch User's Pets
The dashboard must fetch all pet records where `ownerId` matches the current authenticated user's ID, ordered by `createdAt` descending (newest first).

### FR-02 — Include Primary Image
For each pet, the system must include the primary image (order 0) if one exists. This is used as the card thumbnail.

### FR-03 — Responsive Card Layout
Pets must be displayed as cards in a responsive grid:
- 1 column on mobile (< 640px)
- 2 columns on tablet (640px–1024px)
- 3 columns on desktop (≥ 1024px)

### FR-04 — Card Content
Each pet card must display:
- Primary image (or placeholder if no images exist)
- Pet name
- Status badge (draft/published/adopted with color coding)
- Species (icon or label)
- Breed
- Location (city, state)
- Registration date (formatted)

### FR-05 — Card Actions
Each pet card must include:
- "View" link → navigates to `/pets/[id]`
- "Edit" link → navigates to `/pets/[id]/edit`

### FR-06 — Empty State
When the user has no registered pets, the dashboard must display:
- A friendly illustration or icon
- A message: "You haven't registered any pets yet."
- A call-to-action button: "Register your first pet" → `/pets/new`

### FR-07 — Loading State
While data is being fetched, the dashboard must show skeleton cards matching the final card layout to avoid layout shift.

### FR-08 — Error State
If the fetch fails, the dashboard must show a user-friendly error message with a "Try again" button (retry via React error boundary reset).

### FR-09 — Quick Actions Preserved
The existing "Register a pet" button in the Quick Actions section must remain above the pet list.

### FR-10 — Pet Count Display
Show a count indicator: "Your pets (N)" in the section heading.

---

## User Stories

### US-01 — See my pets at a glance
> **As a** rescuer,  
> **I want to** see all my registered pets on the dashboard,  
> **so that** I can quickly understand what I've posted and their current status.

### US-02 — Navigate to pet details
> **As a** rescuer,  
> **I want to** click on a pet card to see its full details,  
> **so that** I can review or manage the pet's profile.

### US-03 — See empty state with guidance
> **As a** new user,  
> **I want to** see a clear call-to-action when I have no pets,  
> **so that** I know how to get started.

### US-04 — Identify pets visually
> **As a** rescuer,  
> **I want to** see the primary photo on each card,  
> **so that** I can quickly identify which pet is which.

---

## Acceptance Criteria

### AC-01 — Cards render for all pets
- **Given** the user has 3 registered pets,
- **When** they visit `/dashboard`,
- **Then** 3 pet cards are displayed, one per pet.

### AC-02 — Primary image displayed
- **Given** a pet has images with order 0, 1, 2,
- **When** the card renders,
- **Then** only the order-0 image is shown as the card thumbnail.

### AC-03 — Placeholder for imageless pets
- **Given** a pet has no uploaded images,
- **When** the card renders,
- **Then** a placeholder (icon or illustration) is shown instead of a blank space.

### AC-04 — Status badge colors
- **Given** pets with different statuses,
- **When** cards render,
- **Then** draft = neutral, published = green, adopted = blue.

### AC-05 — Empty state
- **Given** the user has 0 pets,
- **When** they visit `/dashboard`,
- **Then** the empty state message and CTA are displayed instead of the card grid.

### AC-06 — Loading skeleton
- **Given** data is being fetched,
- **When** the page is loading,
- **Then** skeleton cards matching the layout are shown.

### AC-07 — Responsive columns
- **Given** a desktop viewport (≥ 1024px),
- **When** the grid renders,
- **Then** cards are in a 3-column layout.

### AC-08 — View link works
- **Given** a pet card with id `abc123`,
- **When** the user clicks "View",
- **Then** they navigate to `/pets/abc123`.

### AC-09 — Newest first ordering
- **Given** pets created at different times,
- **When** the grid renders,
- **Then** the most recently created pet appears first.
