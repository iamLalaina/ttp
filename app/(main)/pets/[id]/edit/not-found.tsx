import Link from "next/link";

/**
 * Not-found page for /pets/[id]/edit.
 *
 * Displayed when the pet doesn't exist or the user doesn't own it.
 */
export default function EditPetNotFound() {
  return (
    <div className="py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Pet not found</h1>
      <p className="text-sm text-muted-foreground">
        The pet you&apos;re trying to edit doesn&apos;t exist or you don&apos;t
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
