import type { Metadata } from "next";
import { getPublishedPets } from "@/services/catalog.service";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";

export const metadata: Metadata = {
  title: "Adopt a Pet",
};

/**
 * /catalog — Public pet catalog page (Server Component)
 *
 * Displays all published pets available for adoption.
 * No authentication required.
 */
export default async function CatalogPage() {
  const pets = await getPublishedPets();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Adopt a Pet
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse pets looking for a forever home. Click on any pet to learn more
          about them.
        </p>
      </div>

      {/* Catalog grid or empty state */}
      {pets.length > 0 ? <CatalogGrid pets={pets} /> : <CatalogEmptyState />}
    </div>
  );
}
