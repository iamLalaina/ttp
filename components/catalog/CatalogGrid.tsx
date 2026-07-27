import type { PublicPetCard } from "@/types/pet.types";
import { CatalogPetCard } from "@/components/catalog/CatalogPetCard";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CatalogGridProps {
  pets: PublicPetCard[];
}

// ---------------------------------------------------------------------------
// CatalogGrid
// ---------------------------------------------------------------------------

/**
 * Renders a responsive grid of public pet cards.
 * Server Component — no client interactivity required.
 */
export function CatalogGrid({ pets }: CatalogGridProps) {
  return (
    <section aria-labelledby="catalog-grid-heading" className="space-y-4">
      <h2
        id="catalog-grid-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Pets available for adoption ({pets.length})
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <CatalogPetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </section>
  );
}
