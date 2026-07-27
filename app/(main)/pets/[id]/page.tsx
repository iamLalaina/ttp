import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/cognito";
import { getPetByIdForOwner } from "@/services/pet.service";
import { getImagesForPet } from "@/services/image.service";
import { PetDetailView } from "@/components/pets/PetDetailView";
import { PetPhotoUploader } from "@/components/pets/PetPhotoUploader";

// ---------------------------------------------------------------------------
// Request-scoped cached functions (deduplicated across generateMetadata + page)
// ---------------------------------------------------------------------------

const getUser = cache(async () => {
  return getCurrentUserFromCookies();
});

const getPet = cache(async (id: string, ownerId: string) => {
  return getPetByIdForOwner(id, ownerId);
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetDetailPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: PetDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    return { title: "Pet not found" };
  }

  const pet = await getPet(id, user.id);
  return { title: pet ? pet.name : "Pet not found" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * /pets/[id] — Pet detail page (Server Component)
 *
 * Fetches the pet record by ID, verifies ownership, loads images,
 * and renders the detail view with photo gallery and uploader.
 * Protected by middleware — only authenticated users reach this page.
 *
 * Uses React cache() to deduplicate getCurrentUserFromCookies and
 * getPetByIdForOwner calls between generateMetadata and the page render.
 */
export default async function PetDetailPage({ params }: PetDetailPageProps) {
  const { id } = await params;

  // Auth check — middleware already redirected if no token, but we need the user ID
  const user = await getUser();
  if (!user) {
    notFound();
  }

  // Fetch pet with ownership guard (deduplicated with generateMetadata)
  const pet = await getPet(id, user.id);
  if (!pet) {
    notFound();
  }

  // Fetch images for this pet
  const images = await getImagesForPet(pet.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/dashboard" className="hover:text-foreground hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground" aria-current="page">
            {pet.name}
          </li>
        </ol>
      </nav>

      {/* Pet detail info */}
      <PetDetailView pet={pet} />

      {/* Photo uploader (interactive management) */}
      <PetPhotoUploader petId={pet.id} initialImages={images} />
    </div>
  );
}
