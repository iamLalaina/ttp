# Requirements — Pet Registration

## Overview

This specification covers the first MVP feature of **Tracing Tiny Paws (TTP)**: allowing authenticated rescuers and shelter staff to register a new pet that will later be published in the public adoption catalog.

**Out of scope for this spec:**
- AI-generated description (separate spec)
- Photo upload to Amazon S3 (separate spec)
- Authentication implementation (separate spec)
- Adoption requests (separate spec)

---

## Functional Requirements

### FR-01 — Access Control
The pet registration page must be accessible only to authenticated users. Unauthenticated users attempting to access the page must be redirected to the login page.

### FR-02 — Registration Form
The system must present a form that allows the rescuer to enter the following data about a pet:

| Field | Type | Required |
|---|---|---|
| Name | Text | Yes |
| Species | Enum: `dog`, `cat` | Yes |
| Breed | Text | Yes |
| Estimated age | Number (months) | Yes |
| Sex | Enum: `male`, `female` | Yes |
| Size | Enum: `small`, `medium`, `large` | Yes |
| Health status | Long text | Yes |
| Vaccination status | Enum: `up_to_date`, `partial`, `unknown` | Yes |
| Sterilized | Enum: `yes`, `no`, `unknown` | Yes |
| Friendly with children | Enum: `yes`, `no`, `unknown` | Yes |
| Friendly with other animals | Enum: `yes`, `no`, `unknown` | Yes |
| Short description | Long text (manual) | Yes |
| City | Text | Yes |
| State | Text | Yes |

### FR-03 — Client-Side Validation
The form must validate all fields on the client side before submission. Invalid fields must display clear, localized error messages adjacent to the field. Submission must be blocked until all errors are resolved.

### FR-04 — Server-Side Validation
The API endpoint must independently validate all incoming data using Zod schemas. It must reject requests with malformed or missing data and return structured error responses regardless of what the client sends.

### FR-05 — Data Persistence
Upon successful validation, the system must persist the pet record in the PostgreSQL database via Prisma, associating it with the authenticated user's ID (`ownerId`).

### FR-06 — Initial Status
Every newly registered pet must be saved with a status of `draft`. It will not appear in the public catalog until a separate publish action is taken (future spec).

### FR-07 — Success Feedback and Redirect
After a successful registration, the user must receive a success notification and be redirected to the pet's detail page (`/pets/[id]`).

### FR-08 — Error Feedback
If the server returns an error (validation failure, server error), the form must display a non-blocking error message without losing the user's input.

### FR-09 — Navigation
The registration page must be reachable from the authenticated dashboard via a clearly labeled call-to-action (e.g., "Register a pet").

---

## User Stories

### US-01 — Register a new pet
> **As a** rescuer,  
> **I want to** fill out a form with my pet's information,  
> **so that** I can create a profile that will be published for adoption.

### US-02 — Receive validation feedback
> **As a** rescuer,  
> **I want to** see specific error messages when I submit incomplete or invalid data,  
> **so that** I know exactly what to correct without losing my progress.

### US-03 — Confirm successful registration
> **As a** rescuer,  
> **I want to** see a confirmation and be taken to the pet's profile page after a successful registration,  
> **so that** I know the pet was saved and I can review its information.

### US-04 — Save a draft without publishing
> **As a** rescuer,  
> **I want** newly registered pets to start as drafts,  
> **so that** I can complete other steps (add photos, AI description) before the pet is visible to potential adopters.

---

## Acceptance Criteria

### AC-01 — Form renders all required fields
- **Given** an authenticated rescuer on `/pets/new`,
- **When** the page loads,
- **Then** all 14 fields defined in FR-02 are visible and interactive.

### AC-02 — Required field validation on submit
- **Given** the rescuer submits the form with one or more empty required fields,
- **When** the form validates,
- **Then** each empty required field shows an inline error message and the form is not submitted.

### AC-03 — Enum fields use correct options
- **Given** the rescuer interacts with any enum field,
- **When** they open the selector,
- **Then** only the valid options defined in FR-02 are available (no free-text input allowed for enum fields).

### AC-04 — Successful registration persists data
- **Given** the rescuer fills in all fields with valid data and submits,
- **When** the API processes the request,
- **Then** a new `Pet` record is created in the database with status `draft`, all submitted fields stored correctly, and `ownerId` set to the authenticated user's ID.

### AC-05 — Redirect after success
- **Given** the API returns a 201 response,
- **When** the client receives the response,
- **Then** the user is redirected to `/pets/[id]` where `[id]` is the newly created pet's ID, and a success toast is displayed.

### AC-06 — Server-side validation rejects bad input
- **Given** a request is sent directly to `POST /api/pets` with missing or invalid fields,
- **When** the Route Handler processes the request,
- **Then** it returns a `400` response with `{ data: null, error: { code: "VALIDATION_ERROR", message: "..." } }`.

### AC-07 — Unauthenticated access is blocked
- **Given** an unauthenticated user navigates to `/pets/new`,
- **When** middleware evaluates the request,
- **Then** the user is redirected to `/login`.

### AC-08 — Server error does not lose form data
- **Given** the API returns a 500 error,
- **When** the client receives the error,
- **Then** the form displays a global error message and all field values remain intact.

### AC-09 — Age field accepts months only
- **Given** the rescuer enters an estimated age,
- **When** they type a non-positive or non-integer value,
- **Then** the field shows a validation error and blocks submission.

### AC-10 — Description length constraint
- **Given** the rescuer types in the short description field,
- **When** the character count exceeds 500,
- **Then** the field shows an error indicating the maximum length.
