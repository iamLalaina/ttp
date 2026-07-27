import Link from "next/link";
import { PawPrint } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Empty state shown on the dashboard when the user has no registered pets.
 * Server Component — no client interactivity required.
 */
export function PetEmptyState() {
  return (
    <section
      aria-labelledby="empty-state-heading"
      className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center"
    >
      <PawPrint className="size-16 text-muted-foreground/40" />

      <div className="space-y-1">
        <h2
          id="empty-state-heading"
          className="text-base font-semibold text-foreground"
        >
          You haven&apos;t registered any pets yet.
        </h2>
        <p className="text-sm text-muted-foreground">
          Start by registering your first pet to create a profile for adoption.
        </p>
      </div>

      <Link
        href="/pets/new"
        className={cn(buttonVariants({ variant: "default", size: "lg" }), "mt-2")}
      >
        Register your first pet
      </Link>
    </section>
  );
}
