# Requirements — Pet Edit

## Overview

This specification implements the pet editing flow at `/pets/[id]/edit`. It allows authenticated rescuers to update their pet's information and change its publication status. The form reuses the same field structure as the pet registration form, pre-populated with existing data.

**Out of scope:**
- Image management (handled by `PetPhotoUploader` on the detail page)
- AI description regeneration (separate spec)
- Batch editing of multiple pets
- Pet deletion
- Changing the pet's owner

---

## Functional Requirements

### FR-01 — Route Structure
The edit page must be accessible at `/pets/[id]/edit` where `[id]` is the pet's CUID.

### FR-02 — Access Control
The page must be protected. Unauthenticated users must be redirected to `/login` (handled by existing middleware).

### FR-03 — Ownership Verification
The server must verify that the authenticated user is the owner of the pet. If not, return 404.

### FR-04 — Pre-populated Form
The edit form must load with all current field values pre-filled. The user edits only what they want to change.

### FR-05 — Editable Fields
The following fields must be editable:
- Name, species, breed, age, sex, size
- Health status, vaccination status, sterilized
- Friendly with children, friendly with animals
- Description
- City, state

### FR-06 — Status Change
The edit form must include a status field allowing the owner to change between:
- `draft` — pet not visible in catalog
- `published` — pet visible in public catalog

The `adopted` status is not settable from the edit form (future adoption flow).

### FR-07 — Validation
Client-side and server-side validation must follow the same rules as pet registration (same Zod schema for the data fields). The status field uses a separate validation rule.

### FR-08 — API Endpoint
A `PATCH /api/pets/[id]` endpoint must accept partial or full updates to the pet record.

### FR-09 — Success Redirect
After a successful update, the user must be redirected to `/pets/[id]` (the detail page) with the updated data.

### FR-10 — Error Handling
- Validation errors: inline field messages (same as registration)
- Server errors: global alert without losing form data
- Not found: 404 page

### FR-11 — Loading State
The edit page must show a loading skeleton while fetching the pet data.

### FR-12 — Metadata
The page must set a dynamic `<title>`: "Edit {petName} — TTP".

---

## User Stories

### US-01 — Update pet information
> **As a** rescuer,  
> **I want to** edit my pet's profile after registration,  
> **so that** I can fix mistakes or add information I learned later.

### US-02 — Publish a pet
> **As a** rescuer,  
> **I want to** change my pet's status from draft to published,  
> **so that** it appears in the public adoption catalog.

### US-03 — Unpublish a pet
> **As a** rescuer,  
> **I want to** change my pet's status back to draft,  
> **so that** it's hidden from the catalog while I make changes.

### US-04 — See current data pre-filled
> **As a** rescuer,  
> **I want to** see the existing pet data already filled in the form,  
> **so that** I only need to change what's different.

---

## Acceptance Criteria

### AC-01 — Form pre-populated
- **Given** a pet with name "Luna", species "dog", breed "Labrador",
- **When** the owner opens `/pets/[id]/edit`,
- **Then** all form fields are pre-filled with the current values.

### AC-02 — Successful update
- **Given** the owner changes the breed to "Golden Retriever" and submits,
- **When** the API processes the request,
- **Then** the database record is updated and the user is redirected to `/pets/[id]`.

### AC-03 — Publish pet
- **Given** a pet with status "draft",
- **When** the owner changes status to "published" and saves,
- **Then** the pet appears in the public catalog.

### AC-04 — Unpublish pet
- **Given** a pet with status "published",
- **When** the owner changes status to "draft" and saves,
- **Then** the pet no longer appears in the public catalog.

### AC-05 — Validation errors
- **Given** the owner clears the name field and submits,
- **When** the form validates,
- **Then** an inline error appears for the name field and the form is not submitted.

### AC-06 — Ownership blocks other users
- **Given** user A tries to access `/pets/[id]/edit` for user B's pet,
- **When** the page loads,
- **Then** a 404 is returned.

### AC-07 — Server error preserves data
- **Given** a server error occurs during update,
- **When** the client receives the error,
- **Then** the form values are preserved and a global error message is shown.

### AC-08 — Status field excludes "adopted"
- **Given** the edit form status selector,
- **When** the owner opens it,
- **Then** only "Draft" and "Published" options are available.
