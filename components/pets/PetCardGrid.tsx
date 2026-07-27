import type { PetWithPrimaryImage } from "@/types/pet.types";
import { PetCard } from "@/components/pets/PetCard";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetCardGridProps {
  pets: PetWithPrimaryImage[];
}

// ---------------------------------------------------------------------------
// PetCardGrid
// ---------------------------------------------------------------------------

/**
 * Renders a responsive grid of pet cards with a count heading.
 * Server Component — no client interactivity required.
 */
export function PetCardGrid({ pets }: PetCardGridProps) {
  return (
    <section aria-labelledby="pet-grid-heading" className="space-y-4">
      <h2
        id="pet-grid-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Your pets ({pets.length})
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </section>
  );
}
