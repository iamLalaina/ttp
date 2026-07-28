# 🐾 Tracing Tiny Paws (TTP)

> **An MVP built during the Kiro + AWS Hackathon to simplify responsible pet adoption through a modern full-stack architecture and cloud-native services.**

---

## 📌 Project Status

🚀 **MVP — Hackathon Edition**

This repository contains the first functional version of **Tracing Tiny Paws**, developed as an individual project during the **Kiro + AWS Hackathon (Web Applications Challenge)**.

The project was intentionally designed with a scalable architecture to support future features such as AI-assisted pet descriptions, intelligent adopter-pet matching, geolocation search, and shelter management.

---

# 🌎 Problem

Animal rescuers and shelters often rely on scattered social media posts, messaging apps, and informal communication channels to publish pets available for adoption.

As a result:

* Pet information becomes fragmented.
* Adoption requests are difficult to organize.
* Updates are hard to maintain.
* Potential adopters struggle to find reliable information.

This creates unnecessary friction for both rescuers and families looking to adopt.

---

# 💡 Solution

**Tracing Tiny Paws (TTP)** is a full-stack web application that centralizes the adoption process into a single platform.

The application allows rescuers to publish and manage pets while providing adopters with a simple, transparent, and organized experience for discovering pets and submitting adoption requests.

Instead of relying on multiple disconnected platforms, TTP offers a structured digital solution designed to grow into a complete adoption ecosystem.

---

# ✨ Main Features

## 🐶 Public Adoption Catalog

Anyone can browse pets available for adoption without authentication.

Features include:

* Browse available pets
* View detailed pet information
* View rescuer profiles
* Access adoption requests
* Display pet photographs

---

## 👤 Rescuer Profiles

Registered rescuers can create public profiles including:

* Organization or rescuer name
* Description
* Location
* Published pets

Example:

* Refugio Luna
* Pekitas y Patitas
* Monterrey, Nuevo León

---

## 🐾 Pet Management

Authenticated rescuers can:

* Register pets
* Edit pet information
* Upload photographs
* Publish adoption listings

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
* Description

---

## 💌 Adoption Requests

Potential adopters can:

* View pet details
* Access rescuer information
* Submit adoption requests
* Begin the adoption process

---

## 🔐 Authentication

Secure authentication is implemented using **Amazon Cognito**.

Features:

* User registration
* Email verification
* Secure login
* Session management
* Protected routes

---

# 🚀 Live Demo

**Production**

https://ttp-khaki.vercel.app

Useful pages:

* `/catalog`
* `/login`
* `/register`

---

# 🏗️ System Architecture

```text
                        Users
                           │
                           │
                  Next.js Web Application
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
     React UI                       API Route Handlers
         │                                   │
         │                          Business Logic
         │                          Validation
         │
         └───────────────┬────────────────────┘
                         │
                      Prisma ORM
                         │
                  PostgreSQL Database
                     (Supabase)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
 Amazon Cognito                     Amazon S3
 Authentication                  Pet Image Storage
```

---

# ☁️ AWS Services

## Amazon Cognito

Used for:

* User authentication
* Email verification
* JWT token management
* Secure session handling

**Why?**

Using Cognito removes the need to build a custom authentication system while providing a secure and scalable identity solution.

---

## Amazon S3

Used for:

* Pet image uploads
* Cloud image storage
* Public image delivery

**Why?**

Keeping images outside the application server improves scalability and simplifies storage management.

---

# 🛠️ Tech Stack

## Frontend

* Next.js 15 (App Router)
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui

---

## Backend

* Next.js API Route Handlers
* Prisma ORM
* PostgreSQL
* Zod

---

## Database

* PostgreSQL (Supabase)

Stores:

* Users
* Rescuer Profiles
* Pets
* Images
* Adoption Requests

---

## Cloud

* Amazon Cognito
* Amazon S3

---

## Deployment

* Vercel
* GitHub

---

# 📂 Project Structure

```text
app/
├── (auth)/
│   ├── login
│   └── register
│
├── (public)/
│   ├── catalog
│   ├── pets
│   └── rescuers
│
├── (main)/
│   ├── dashboard
│   ├── profile
│   ├── pets
│   └── requests
│
└── api/

components/
lib/
repositories/
services/
schemas/
types/
prisma/
public/
```

---

# ⚙️ Local Development

## Requirements

* Node.js 22+
* PostgreSQL
* AWS Account (for Cognito and S3)

---

## Installation

```bash
git clone https://github.com/iamLalaina/ttp.git

cd ttp

npm install
```

> *(If preferred, the project can also be installed using `pnpm install`.)*

Copy the environment variables:

```bash
cp .env.example .env.local
```

Run migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run the application:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🔐 Environment Variables

```env
DATABASE_URL=

NEXT_PUBLIC_APP_URL=

AWS_REGION=

AWS_S3_BUCKET_NAME=

AWS_ACCESS_KEY_ID=

AWS_SECRET_ACCESS_KEY=

AWS_COGNITO_USER_POOL_ID=

AWS_COGNITO_CLIENT_ID=

AUTH_DEV_MODE=true

AUTH_DEV_USER_ID=
```

---

# 🧪 Development Mode

For local development the application supports a development authentication mode.

```env
AUTH_DEV_MODE=true
```

This allows developers to test protected functionality without requiring a complete Cognito configuration.

Production mode uses:

* Amazon Cognito
* JWT validation
* Secure authentication flow

---

# 🚀 Roadmap

## ✅ Current MVP

* User authentication
* Public adoption catalog
* Rescuer profiles
* Pet management
* Image uploads
* Adoption request flow
* Cloud storage
* Production deployment

---

## 🔄 Next Release

* AI-assisted pet descriptions
* Automatic pet information suggestions
* Geolocation search
* Advanced adoption filters
* Email notifications

---

## 🌟 Future Vision

Tracing Tiny Paws is designed to evolve into a complete platform for responsible pet adoption by incorporating:

* AI-powered pet compatibility
* Intelligent search and recommendations
* Shelter administration tools
* Veterinary integrations
* Adoption analytics
* Mobile application
* AWS Bedrock integration
* Community features

---

# 🏆 Hackathon

This project was developed as an individual submission for the **Kiro + AWS Hackathon**, under the **Web Applications Challenge**.

The project demonstrates:

* ✅ Full-stack web development
* ✅ Modern application architecture
* ✅ AWS cloud integration
* ✅ Authentication with Amazon Cognito
* ✅ Cloud storage using Amazon S3
* ✅ Database persistence
* ✅ Production deployment
* ✅ Scalable project organization

---

# 👩‍💻 Author

Developed by **Liliana Abigail Torres López**.

Tracing Tiny Paws was inspired by personal experiences and created with the vision of using technology to make responsible pet adoption more organized, accessible, and efficient.

---

# 📄 License

This project was created for educational purposes as part of the **Kiro + AWS Hackathon**.

It represents the first MVP of a platform that will continue evolving beyond the competition.
