import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPetById } from "@/services/catalog.service";
import { getImagesForPet } from "@/services/image.service";
import { PetImageGallery } from "@/components/pets/PetImageGallery";
import { PublicPetDetailView } from "@/components/catalog/PublicPetDetailView";
import { AdoptionRequestForm } from "@/components/catalog/AdoptionRequestForm";

// ---------------------------------------------------------------------------
// Request-scoped cached function (deduplicated between generateMetadata + page)
// ---------------------------------------------------------------------------

const getPet = cache(async (id: string) => getPublishedPetById(id));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicPetDetailPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: PublicPetDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPet(id);
  return { title: pet ? pet.name : "Pet not found" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * /catalog/[id] — Public pet detail page (Server Component)
 *
 * Displays the full public profile of a published pet.
 * Returns 404 for non-existent or unpublished pets.
 * No authentication required.
 *
 * Uses React cache() to deduplicate getPublishedPetById calls
 * between generateMetadata and the page render.
 */
export default async function PublicPetDetailPage({
  params,
}: PublicPetDetailPageProps) {
  const { id } = await params;

  // Fetch published pet (deduplicated with generateMetadata)
  const pet = await getPet(id);
  if (!pet) {
    notFound();
  }

  // Fetch images for the gallery
  const images = await getImagesForPet(pet.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/catalog" className="hover:text-foreground hover:underline">
              Catalog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground" aria-current="page">
            {pet.name}
          </li>
        </ol>
      </nav>

      {/* Photo gallery */}
      <PetImageGallery images={images} petName={pet.name} />

      {/* Public pet information */}
      <PublicPetDetailView pet={pet} />

      {/* Adoption request form */}
      <AdoptionRequestForm petId={pet.id} />
    </div>
  );
}
