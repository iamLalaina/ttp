-- CreateEnum
CREATE TYPE "Species" AS ENUM ('dog', 'cat');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "PetSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "VaccinationStatus" AS ENUM ('up_to_date', 'partial', 'unknown');

-- CreateEnum
CREATE TYPE "YesNoUnknown" AS ENUM ('yes', 'no', 'unknown');

-- CreateEnum
CREATE TYPE "PetStatus" AS ENUM ('draft', 'published', 'adopted');

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT NOT NULL,
    "ageInMonths" INTEGER NOT NULL,
    "sex" "Sex" NOT NULL,
    "size" "PetSize" NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "vaccinationStatus" "VaccinationStatus" NOT NULL,
    "sterilized" "YesNoUnknown" NOT NULL,
    "friendlyWithChildren" "YesNoUnknown" NOT NULL,
    "friendlyWithAnimals" "YesNoUnknown" NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" "PetStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");

-- CreateIndex
CREATE INDEX "Pet_status_idx" ON "Pet"("status");

-- CreateIndex
CREATE INDEX "Pet_species_idx" ON "Pet"("species");
