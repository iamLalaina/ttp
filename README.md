# Tracing Tiny Paws (TTP)

A responsible pet adoption platform connecting rescuers, shelters, and potential adopters.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npx prisma migrate dev

# Seed development data
npx prisma db seed

# Start development server
npm run dev
```

## Authentication Setup

TTP uses **AWS Cognito** for authentication. There are two modes:

### Development Mode (no AWS required)

Set these in `.env.local`:

```env
AUTH_DEV_MODE=true
AUTH_DEV_USER_ID=dev-user-id
```

This skips JWT verification and uses a fixed user ID. The login page accepts any email/password and sets a dev cookie. Ideal for local development without AWS credentials.

**Important:** Make sure your seed data's `ownerId` matches `AUTH_DEV_USER_ID`.

### Production Mode (AWS Cognito)

1. **Create a Cognito User Pool** in the AWS Console:
   - Pool name: `ttp-users` (or your choice)
   - Sign-in: Email
   - Password policy: minimum 8 characters, require uppercase + lowercase + numbers
   - MFA: Optional (not required for MVP)
   - Email verification: Required

2. **Create an App Client** in the User Pool:
   - Client name: `ttp-web`
   - Authentication flows: `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
   - No client secret (public client)

3. **Set environment variables:**

```env
AUTH_DEV_MODE=false
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=your-app-client-id
```

4. The app will now:
   - Verify JWT signatures against Cognito's JWKS endpoint
   - Use the Cognito `sub` UUID as the user's `ownerId`
   - Handle registration, email verification, login, token refresh, and logout

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AWS_REGION` | Yes | AWS region for Cognito and S3 |
| `AWS_COGNITO_USER_POOL_ID` | Yes* | Cognito User Pool ID |
| `AWS_COGNITO_CLIENT_ID` | Yes* | Cognito App Client ID |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the application |
| `AUTH_DEV_MODE` | No | Set to `true` for dev mode (skips JWT verification) |
| `AUTH_DEV_USER_ID` | No | User ID used in dev mode (default: `dev-user-id`) |
| `AWS_S3_BUCKET_NAME` | For uploads | S3 bucket for pet photos |
| `AWS_ACCESS_KEY_ID` | For uploads | IAM credentials |
| `AWS_SECRET_ACCESS_KEY` | For uploads | IAM credentials |

*Not required when `AUTH_DEV_MODE=true`

## Architecture

```
app/(auth)/*          → Public auth pages (login, register)
app/(public)/*        → Public pages (catalog, rescuer profiles)
app/(main)/*          → Protected pages (dashboard, pets, requests, profile)
app/api/*             → API Route Handlers

repositories/         → Prisma database access
services/             → Business logic
schemas/              → Zod validation
types/                → TypeScript types
lib/                  → Singletons and utilities
components/           → React components
```

## Tech Stack

- Next.js 15 (App Router, Turbopack)
- React 19 (Server Components)
- TypeScript 5 (strict mode)
- Tailwind CSS v4 + shadcn/ui
- Prisma 7 + PostgreSQL (Supabase)
- AWS Cognito (authentication)
- AWS S3 (image storage)
- Zod v4 (validation)

Frontend
├── Next.js 15
├── React
├── TypeScript

Backend
├── API Routes
├── Prisma
├── PostgreSQL

AWS
├── Amazon S3

Authentication
├── Amazon Cognito (modo desarrollo para pruebas)

Deployment
├── Vercel