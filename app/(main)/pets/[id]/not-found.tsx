import Link from "next/link";

/**
 * Not-found page for /pets/[id]
 *
 * Displayed when notFound() is called — either the pet doesn't exist
 * or the authenticated user is not the owner.
 */
export default function PetNotFound() {
  return (
    <div className="py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Pet not found</h1>
      <p className="text-sm text-muted-foreground">
        The pet you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access to it.
      </p>
      <Link
        href="/dashboard"
        className="inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
