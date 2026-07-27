import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/cognito";
import { getPetByIdForOwner } from "@/services/pet.service";
import { PetEditForm } from "@/components/pets/PetEditForm";

// ---------------------------------------------------------------------------
// Cached data fetching (deduplicated between generateMetadata + page)
// ---------------------------------------------------------------------------

const getUser = cache(async () => getCurrentUserFromCookies());
const getPet = cache(async (id: string, ownerId: string) => getPetByIdForOwner(id, ownerId));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditPetPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: EditPetPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser();

  if (!user) return { title: "Pet not found" };

  const pet = await getPet(id, user.id);
  return { title: pet ? `Edit ${pet.name}` : "Pet not found" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * /pets/[id]/edit — Pet edit page (Server Component)
 *
 * Loads the pet's current data and renders the edit form.
 * Protected by middleware + ownership check.
 */
export default async function EditPetPage({ params }: EditPetPageProps) {
  const { id } = await params;

  const user = await getUser();
  if (!user) {
    notFound();
  }

  const pet = await getPet(id, user.id);
  if (!pet) {
    notFound();
  }

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
          <li>
            <Link href={`/pets/${pet.id}`} className="hover:text-foreground hover:underline">
              {pet.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground" aria-current="page">
            Edit
          </li>
        </ol>
      </nav>

      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit {pet.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your pet&apos;s information. Changes are saved immediately.
        </p>
      </div>

      {/* Form */}
      <PetEditForm pet={pet} />
    </div>
  );
}
