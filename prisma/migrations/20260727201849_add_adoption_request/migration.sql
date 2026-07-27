-- CreateEnum
CREATE TYPE "AdoptionRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "AdoptionRequest" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdoptionRequest_petId_idx" ON "AdoptionRequest"("petId");

-- CreateIndex
CREATE INDEX "AdoptionRequest_status_idx" ON "AdoptionRequest"("status");

-- CreateIndex
CREATE INDEX "AdoptionRequest_petId_applicantEmail_idx" ON "AdoptionRequest"("petId", "applicantEmail");

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
