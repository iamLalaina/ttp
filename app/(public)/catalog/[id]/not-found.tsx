import Link from "next/link";

/**
 * Not-found page for /catalog/[id].
 *
 * Displayed when the pet doesn't exist or is not published.
 */
export default function PublicPetNotFound() {
  return (
    <div className="py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Pet not found</h1>
      <p className="text-sm text-muted-foreground">
        This pet doesn&apos;t exist or is no longer available for adoption.
      </p>
      <Link
        href="/catalog"
        className="inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Back to Catalog
      </Link>
    </div>
  );
}
