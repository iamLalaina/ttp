import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileById } from "@/services/profile.service";
import { getPublishedPetsByOwner } from "@/services/catalog.service";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// Cached fetch (deduplicated between generateMetadata + page)
// ---------------------------------------------------------------------------

const getProfile = cache(async (id: string) => getProfileById(id));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RescuerPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: RescuerPageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  return { title: profile ? profile.displayName : "Rescuer not found" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * /rescuers/[id] — Public rescuer profile page (Server Component).
 * No authentication required.
 * Shows profile info + published pets for this rescuer.
 */
export default async function RescuerProfilePage({ params }: RescuerPageProps) {
  const { id } = await params;

  const profile = await getProfile(id);
  if (!profile) {
    notFound();
  }

  // Fetch published pets using the ownerId from the full profile (server-side only)
  const pets = await getPublishedPetsByOwner(profile.ownerId);

  // Map profile to public-safe subset for the view component
  const publicProfile = {
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    city: profile.city,
    state: profile.state,
    phone: profile.phone,
    websiteUrl: profile.websiteUrl,
    imageUrl: profile.imageUrl,
  };

  return (
    <div className="space-y-8">
      <PublicProfileView profile={publicProfile} />

      {pets.length > 0 && <CatalogGrid pets={pets} />}
    </div>
  );
}
