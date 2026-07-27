"use client";

/**
 * Error boundary for /catalog/[id].
 *
 * Displayed when an unhandled error occurs during data fetching.
 * Does not expose internal error details.
 */
export default function PublicPetDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load this pet&apos;s information. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Try again
      </button>
    </div>
  );
}
