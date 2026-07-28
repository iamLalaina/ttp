# 🐾 Tracing Tiny Paws (TTP)

A responsible pet adoption platform that connects rescuers, shelters, and potential adopters through a simple and transparent digital experience.

## 🌎 Problem

Many rescued animals struggle to find adopters because their information is scattered across social networks, messages, and informal channels. Rescuers need an organized way to publish pets, manage their profiles, and receive adoption requests.

**Tracing Tiny Paws (TTP)** provides a centralized platform where rescuers can register pets, upload photos, create public profiles, and connect with people interested in adoption.

## 💡 Solution

TTP is a full-stack web application that allows:

* 🐶 Rescuers and shelters to create profiles.
* 🐾 Register pets available for adoption.
* 📸 Upload and manage pet images.
* 🔎 Browse a public adoption catalog.
* 💌 Send adoption requests.
* 🔐 Authenticate users securely.
* 🗂️ Store pet and user information persistently.

The goal is to make pet adoption more organized, accessible, and trustworthy.

---

# ✨ Main Features

## Public Adoption Catalog

Anyone can browse available pets without authentication.

Features:

* Pet listings
* Pet details
* Rescuer information
* Adoption request flow
* Pet images

## Rescuer Profiles

Registered users can create a public profile containing:

* Organization name
* Description
* Location
* Registered pets

Example:

* Refugio Luna
* Pekitas y patitas
* Monterrey, Nuevo León

## Pet Management

Rescuers can:

* Register pets
* Edit pet information
* Upload images
* Publish pets for adoption

Stored information includes:

* Species
* Breed
* Age
* Sex
* Size
* Vaccination status
* Sterilization status
* Health status
* Compatibility information

## Authentication

Users can:

* Register accounts
* Verify email
* Login
* Maintain authenticated sessions
* Access protected features

Authentication is implemented using Amazon Cognito.

---

# 🚀 Live Demo

Application:

https://ttp-khaki.vercel.app

Example pages:

* Public catalog:
  `/catalog`

* Login:
  `/login`

* Pet details:
  `/catalog/[pet-id]`

---

# 🏗️ Architecture

```
                         Users
                           |
                           |
                    Next.js Application
                           |
        ---------------------------------------
        |                  |                  |
     Frontend          API Routes          Middleware
        |                  |                  |
        |                  |                  |
    React 19          Business Logic     Authentication
    TypeScript        Validation              |
                           |
                    ----------------
                    |              |
                 Prisma        AWS Cognito
                    |
              PostgreSQL
              (Supabase)

                           |
                           |
                         AWS S3
                    Pet image storage
```

---

# 🛠️ Tech Stack

## Frontend

* Next.js 15 App Router
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui

## Backend

* Next.js API Route Handlers
* Prisma ORM
* PostgreSQL database
* Zod validation

## Cloud Services

### AWS Cognito

Used for:

* User authentication
* Email verification
* JWT token management
* Secure sessions

### Amazon S3

Used for:

* Pet image storage
* Image uploads
* Public pet photos

### Supabase PostgreSQL

Used as the application database.

Stores:

* Users
* Rescuer profiles
* Pets
* Images
* Adoption requests

## Deployment

* Vercel
* GitHub

---

# 📂 Project Structure

```
app/
├── (auth)/              Authentication pages
│   ├── login
│   └── register
│
├── (public)/            Public pages
│   ├── catalog
│   └── rescuer profiles
│
├── (main)/              Protected application
│   ├── dashboard
│   ├── pets
│   ├── requests
│   └── profile
│
└── api/                 Backend endpoints


components/              Reusable UI components
lib/                     AWS, Prisma, authentication utilities
schemas/                 Zod validation schemas
services/                Application business logic
repositories/            Database access layer
types/                   TypeScript definitions
prisma/                  Database schema and migrations
```

---

# ⚙️ Local Development

## Requirements

* Node.js 22+
* PostgreSQL database
* AWS account (only required for production authentication/uploads)

## Installation

```bash
git clone https://github.com/iamLalaina/ttp.git

cd ttp

npm install
```

Create environment variables:

```bash
cp .env.example .env.local
```

Run database migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Start development server:

```bash
npm run dev
```

Application runs on:

```
http://localhost:3000
```

---

# 🔐 Environment Variables

Example:

```env
DATABASE_URL="postgresql://..."

AWS_REGION="us-east-2"

AWS_S3_BUCKET_NAME="your-bucket"

AWS_ACCESS_KEY_ID="your-key"

AWS_SECRET_ACCESS_KEY="your-secret"

AUTH_DEV_MODE=true

AUTH_DEV_USER_ID="dev-user-id"
```

---

# 🧪 Development Authentication Mode

For local development, authentication can run in development mode:

```env
AUTH_DEV_MODE=true
```

This allows testing without requiring Cognito configuration.

Production mode uses:

* Cognito User Pool
* JWT verification
* Secure authentication cookies

---

# 🌱 Future Improvements

Possible extensions:

* AI-assisted pet descriptions using AWS Bedrock
* Pet image classification
* Notifications for adoption requests
* Location-based pet discovery
* Progressive Web App offline support

---

# 👩‍💻 Team

Developed as part of the **Reto 2: Aplicaciones Web** challenge.

The project demonstrates:

✅ Full-stack web development
✅ Cloud service integration
✅ Database persistence
✅ Authentication
✅ File storage
✅ Production deployment

---

# 📄 License

This project was created for educational and demonstration purposes.
