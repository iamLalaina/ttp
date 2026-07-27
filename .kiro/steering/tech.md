---
inclusion: always
---

# Tech Stack & Technical Guidelines

## Core Framework

- **Next.js 15** with App Router (no Pages Router)
- **React 19** with Server Components by default; Client Components only when necessary (`"use client"`)
- **TypeScript 5** in strict mode — no `any`, explicit return types on all functions
- **Node.js 20+** (LTS)

---

## Frontend

- **Tailwind CSS v4** for styling — utility-first, no inline styles, no CSS modules unless strictly needed
- **shadcn/ui** as component library base (Radix UI primitives + Tailwind)
- **React Hook Form + Zod** for all forms and client-side validation
- **Zod** also used for server-side schema validation and API input parsing
- **Lucide React** for icons
- **next/image** for all image rendering (never raw `<img>` tags)
- **next/font** for font loading

## State Management

- Server state: **React Server Components + Next.js caching** (fetch with revalidation)
- Client state: **React Context** for lightweight global state (auth session, UI state)
- Avoid adding Redux or Zustand unless complexity clearly justifies it

---

## Backend / API Layer

- **Next.js Route Handlers** (`app/api/`) for all API endpoints
- All routes are typed end-to-end with TypeScript
- Input validation on every route using **Zod schemas**
- HTTP responses follow a consistent envelope:
ts // Success { data: T, error: null } // Error { data: null, error: { code: string, message: string } }
- No business logic inside route handlers — delegate to service layer

---

## Database

- **PostgreSQL** (production) / PostgreSQL via Docker (local dev)
- **Prisma ORM** as the only database access method — no raw SQL unless a migration requires it
- Prisma Client instantiated as a singleton in `src/lib/prisma.ts`
- All schema changes go through Prisma Migrations (`prisma migrate dev`)
- Seed data in `prisma/seed.ts`

---

## Authentication

- **AWS Cognito** via **amazon-cognito-identity-js** or **@aws-amplify/auth** (client-side flows)
- Server-side session validation by verifying Cognito JWT tokens using **jose** or **aws-jwt-verify**
- Auth state exposed via React Context (`AuthContext`) — never access Cognito SDK directly in components
- Protected routes use Next.js middleware (`middleware.ts`) to redirect unauthenticated users
- Tokens stored in **httpOnly cookies** (not localStorage)

---

## File Storage

- **Amazon S3** for all user-uploaded media (pet photos)
- Uploads use **presigned URLs** — the client uploads directly to S3, never through the Next.js server
- Flow: client requests presigned URL from API → API generates URL via AWS SDK v3 → client uploads directly
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) used exclusively (not v2)
- S3 bucket is private; public access via **CloudFront** or presigned GET URLs
- Image keys follow the pattern: `pets/{petId}/{timestamp}-{filename}`

---

## AI Integration

- **OpenAI Node.js SDK** (`openai` package) — never call the REST API directly
- OpenAI client instantiated as a singleton in `src/lib/openai.ts`
- All AI calls are server-side only (Route Handlers or Server Actions) — API key never exposed to the client
- Prompts are defined as constants in `src/lib/prompts.ts`, not inline in business logic
- AI calls are wrapped in try/catch with graceful fallbacks
- Streaming responses used for description generation to improve perceived performance

---

## Environment & Configuration

- All secrets and config via **environment variables** — never hardcoded
- `.env.local` for local dev, validated at startup using a Zod schema in `src/lib/env.ts`
- Required variables:
DATABASE_URL NEXTAUTH_SECRET (if using next-auth as session helper) AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_S3_BUCKET_NAME AWS_COGNITO_USER_POOL_ID AWS_COGNITO_CLIENT_ID OPENAI_API_KEY NEXT_PUBLIC_APP_URL
---

## Code Quality

- **ESLint** with `eslint-config-next` + `@typescript-eslint` rules
- **Prettier** for formatting (enforced via pre-commit hook)
- **Husky + lint-staged** for pre-commit checks (lint + format)
- **Conventional Commits** for all commit messages (`feat:`, `fix:`, `chore:`, etc.)

---

## Testing

- **Vitest** as test runner
- **React Testing Library** for component tests
- **MSW (Mock Service Worker)** for mocking API calls in tests
- Unit tests for all service layer functions
- Integration tests for critical API routes
- Test files colocated with source: `*.test.ts` / `*.test.tsx`

---

## Deployment

- **Vercel** for Next.js hosting (primary target)
- **Neon** or **Supabase** for managed PostgreSQL in production
- CI/CD via **GitHub Actions**: lint → test → build → deploy on merge to `main`
- Preview deployments on every PR

---

## Performance Guidelines

- Use React Server Components for all data-fetching pages
- `loading.tsx` and `error.tsx` in every route segment
- `Suspense` boundaries for async UI sections
- Images always specify `width`, `height`, and `alt`
- No client-side data fetching for initial page load data
---