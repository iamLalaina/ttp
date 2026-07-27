/**
 * Prisma seed file — development data for Tracing Tiny Paws (TTP)
 *
 * Run with: npx prisma db seed
 *
 * Creates two draft pet profiles for local development and manual testing.
 * Safe to run multiple times — existing records with the same seed IDs are
 * upserted rather than duplicated.
 *
 * Prisma 7 requires a driver adapter for runtime connections.
 * dotenv/config is imported to load DATABASE_URL from .env at seed time.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set. Add it to your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

// Stable IDs so repeated runs don't create duplicates
const SEED_PETS = [
  {
    id: "seed-pet-001",
    ownerId: "stub-user-id",
    name: "Luna",
    species: "dog" as const,
    breed: "Labrador mix",
    ageInMonths: 18,
    sex: "female" as const,
    size: "medium" as const,
    healthStatus:
      "Healthy and active. Had a routine checkup last month with no issues found.",
    vaccinationStatus: "up_to_date" as const,
    sterilized: "yes" as const,
    friendlyWithChildren: "yes" as const,
    friendlyWithAnimals: "yes" as const,
    description:
      "Luna is a sweet and energetic mixed-breed dog who loves long walks and cuddles. " +
      "She gets along with everyone she meets — kids, adults, and other dogs alike. " +
      "She is fully house-trained and knows basic commands.",
    city: "Buenos Aires",
    state: "CABA",
    status: "draft" as const,
  },
  {
    id: "seed-pet-002",
    ownerId: "stub-user-id",
    name: "Mochi",
    species: "cat" as const,
    breed: "Domestic shorthair",
    ageInMonths: 8,
    sex: "male" as const,
    size: "small" as const,
    healthStatus:
      "Recovering from a mild respiratory infection. Currently on antibiotics — " +
      "expected full recovery within two weeks.",
    vaccinationStatus: "partial" as const,
    sterilized: "no" as const,
    friendlyWithChildren: "unknown" as const,
    friendlyWithAnimals: "no" as const,
    description:
      "Mochi is a curious and playful young cat who loves to explore every corner of the house. " +
      "He is still getting used to people and prefers a calm, quiet environment. " +
      "He would do best as an only pet with a patient adopter.",
    city: "Rosario",
    state: "Santa Fe",
    status: "draft" as const,
  },
] as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding database...");

  for (const pet of SEED_PETS) {
    const result = await prisma.pet.upsert({
      where: { id: pet.id },
      update: pet,
      create: pet,
    });
    console.log(`  ✔ Pet "${result.name}" (${result.id}) — ${result.status}`);
  }

  console.log(`✅ Seeding complete. ${SEED_PETS.length} pets seeded.`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
