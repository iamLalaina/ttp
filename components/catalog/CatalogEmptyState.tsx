import { PawPrint } from "lucide-react";

/**
 * Empty state shown on the public catalog when no pets are published.
 * Server Component — no interactivity needed.
 */
export function CatalogEmptyState() {
  return (
    <section
      aria-labelledby="catalog-empty-heading"
      className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center"
    >
      <PawPrint className="size-16 text-muted-foreground/40" />

      <div className="space-y-1">
        <h2
          id="catalog-empty-heading"
          className="text-base font-semibold text-foreground"
        >
          No pets available for adoption right now
        </h2>
        <p className="text-sm text-muted-foreground">
          Check back soon! Rescuers are always adding new pets looking for a
          forever home.
        </p>
      </div>
    </section>
  );
}
