import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUserFromCookies } from "@/lib/cognito";
import { getPetsForOwner } from "@/services/pet.service";
import { PetCardGrid } from "@/components/pets/PetCardGrid";
import { PetEmptyState } from "@/components/pets/PetEmptyState";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * /dashboard — Authenticated user dashboard (Server Component)
 *
 * Displays the user's registered pets as a responsive card grid.
 * Fetches data server-side and renders either the card grid or empty state.
 */
export default async function DashboardPage() {
  // Auth — middleware handles redirect, but we need the user ID for the query
  const user = await getCurrentUserFromCookies();
  if (!user) {
    notFound();
  }

  // Fetch pets for the current owner (newest first, with primary image)
  const pets = await getPetsForOwner(user.id);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to Tracing Tiny Paws. Manage your pets and adoption requests here.
        </p>
      </div>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading" className="space-y-3">
        <h2
          id="quick-actions-heading"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Quick actions
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/pets/new"
            className={cn(buttonVariants({ variant: "default", size: "lg" }))}
          >
            Register a pet
          </Link>
        </div>
      </section>

      {/* Pet listing or empty state */}
      {pets.length > 0 ? (
        <PetCardGrid pets={pets} />
      ) : (
        <PetEmptyState />
      )}
    </div>
  );
}
