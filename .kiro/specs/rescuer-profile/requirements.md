# Requirements — Rescuer Profile

## Overview

This specification introduces a rescuer profile system. Pet owners/rescuers can create and manage a public-facing profile that establishes trust with potential adopters. The profile displays contact information, a bio, and links to all the rescuer's published pets.

**Out of scope:**
- Profile image upload to S3 (reuse existing photo upload infra — may be extended in a follow-up)
- Verification badges or identity verification
- Reviews or ratings from adopters
- Messaging between rescuers and adopters
- Multiple profiles per account

---

## Functional Requirements

### Private Side — Profile Management

#### FR-01 — Profile Page
An authenticated rescuer must have a profile management page at `/profile`.

#### FR-02 — Profile Creation
If no profile exists for the current user, the page must display a creation form.

#### FR-03 — Profile Fields
The profile form must allow the rescuer to enter/edit:
- **Display name** — required, 1–100 characters
- **Bio / description** — required, 10–500 characters
- **City** — required, 1–100 characters
- **State** — required, 1–100 characters
- **Phone** — optional, max 20 characters
- **Website / social link** — optional, valid URL if provided, max 255 characters
- **Profile image URL** — optional, valid URL if provided (manual URL entry for MVP; S3 upload in future)

#### FR-04 — Validation
Client-side and server-side validation must follow the same Zod schema pattern.

#### FR-05 — Save / Update
The profile is created on first save and updated on subsequent saves. A single endpoint handles both (upsert pattern).

#### FR-06 — Success Feedback
After saving, the user sees a success message and remains on the profile page.

### Public Side — Rescuer Profile View

#### FR-07 — Public Route
A public rescuer profile page must be accessible at `/rescuers/[id]` without authentication.

#### FR-08 — Public Display
The public profile must show:
- Display name
- Profile image (or placeholder)
- Bio
- City and state
- Phone (if provided)
- Website link (if provided)
- All published pets by this rescuer (reusing existing card components)

#### FR-09 — Only Published Pets
The rescuer's public page must only show pets with `status = "published"`. Draft and adopted pets are hidden.

#### FR-10 — Profile Not Found
If no profile exists for the given ID, return a 404.

#### FR-11 — Link from Catalog
The public pet detail page (`/catalog/[id]`) should link to the rescuer's profile page (if one exists).

### Security

#### FR-12 — Ownership
Only the authenticated owner can view/edit their own profile at `/profile`. The public view at `/rescuers/[id]` exposes only safe fields.

#### FR-13 — No Sensitive Data
The public profile must NOT expose:
- Internal user IDs (Cognito sub)
- Email address (unless the rescuer explicitly provides it via the website field)
- Auth tokens or session data

---

## User Stories

### US-01 — Create my profile
> **As a** rescuer,  
> **I want to** create a public profile with my name and bio,  
> **so that** potential adopters can learn about me and trust my legitimacy.

### US-02 — Update my profile
> **As a** rescuer,  
> **I want to** update my contact information and bio,  
> **so that** my profile stays current.

### US-03 — View a rescuer's profile
> **As a** potential adopter,  
> **I want to** see a rescuer's profile and their published pets,  
> **so that** I can assess their credibility before adopting.

### US-04 — Find rescuer from catalog
> **As a** potential adopter,  
> **I want to** click through from a pet's detail page to the rescuer's profile,  
> **so that** I can learn more about who is offering this pet.

---

## Acceptance Criteria

### AC-01 — Profile creation
- **Given** a rescuer without a profile,
- **When** they visit `/profile`,
- **Then** they see a creation form and can save a new profile.

### AC-02 — Profile update
- **Given** a rescuer with an existing profile,
- **When** they visit `/profile`,
- **Then** the form is pre-filled and they can update their info.

### AC-03 — Public profile displays correctly
- **Given** a rescuer with a profile and 3 published pets,
- **When** a visitor opens `/rescuers/[id]`,
- **Then** the profile info and 3 pet cards are displayed.

### AC-04 — Only published pets on public page
- **Given** a rescuer with 2 published and 1 draft pet,
- **When** the public profile renders,
- **Then** only the 2 published pets appear.

### AC-05 — Profile not found
- **Given** a non-existent profile ID,
- **When** a visitor opens `/rescuers/[id]`,
- **Then** a 404 page is shown.

### AC-06 — Validation errors
- **Given** the rescuer submits an empty display name,
- **When** the form validates,
- **Then** an inline error appears and the form is not submitted.

### AC-07 — No auth required for public page
- **Given** a visitor without login,
- **When** they navigate to `/rescuers/[id]`,
- **Then** the page loads without redirect.

### AC-08 — Link from pet detail
- **Given** a published pet with a rescuer profile,
- **When** a visitor views `/catalog/[id]`,
- **Then** a "View rescuer profile" link is visible.
