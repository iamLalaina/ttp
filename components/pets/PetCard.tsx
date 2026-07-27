import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import type { PetWithPrimaryImage } from "@/types/pet.types";
import { formatDate, capitalize } from "@/utils/format";
import { PetStatusBadge } from "@/components/pets/PetStatusBadge";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetCardProps {
  pet: PetWithPrimaryImage;
}

// ---------------------------------------------------------------------------
// PetCard
// ---------------------------------------------------------------------------

/**
 * Displays a single pet as a card with image, key info, and action links.
 * Server Component — no client interactivity required.
 */
export function PetCard({ pet }: PetCardProps) {
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
        {/* Status badge overlaid on image */}
        <PetStatusBadge status={pet.status} size="sm" className="absolute top-2 left-2" />
      </div>

      {/* Body */}
      <div className="space-y-1.5 p-3">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {pet.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {capitalize(pet.species)} &middot; {pet.breed}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {pet.city}, {pet.state}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatDate(pet.createdAt)}
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <Link
          href={`/pets/${pet.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View
        </Link>
        <span className="text-border">|</span>
        <Link
          href={`/pets/${pet.id}/edit`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
