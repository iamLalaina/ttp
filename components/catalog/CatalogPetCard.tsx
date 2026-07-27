import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import type { PublicPetCard } from "@/types/pet.types";
import { formatAge, capitalize } from "@/utils/format";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CatalogPetCardProps {
  pet: PublicPetCard;
}

// ---------------------------------------------------------------------------
// CatalogPetCard
// ---------------------------------------------------------------------------

/**
 * Displays a single published pet as a card in the public catalog.
 * Server Component — no client interactivity needed.
 *
 * Differences from the owner PetCard:
 * - No status badge (all are published)
 * - No Edit link
 * - Shows formatted age
 * - Single "View details" link
 */
export function CatalogPetCard({ pet }: CatalogPetCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      {/* Image / Placeholder */}
      <div className="relative aspect-[3/2] w-full bg-muted">
        {pet.primaryImageUrl ? (
          <Image
            src={pet.primaryImageUrl}
            alt={`Photo of ${pet.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint className="size-12 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1.5 p-3">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {pet.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {capitalize(pet.species)} &middot; {pet.breed}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatAge(pet.ageInMonths)}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {pet.city}, {pet.state}
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <Link
          href={`/catalog/${pet.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
