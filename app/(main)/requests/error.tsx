"use client";

/**
 * Error boundary for /requests.
 */
export default function RequestsError({
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
        We couldn&apos;t load your adoption requests. Please try again.
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
