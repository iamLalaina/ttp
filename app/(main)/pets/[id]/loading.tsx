/**
 * Loading skeleton for /pets/[id]
 *
 * Matches the PetDetailView layout to prevent layout shift when content resolves.
 */
export default function PetDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading pet details">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        <div className="h-8 w-16 rounded-lg bg-muted" />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-5 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Health status */}
      <div className="space-y-1.5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-16 w-full rounded bg-muted" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-20 w-full rounded bg-muted" />
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4">
        <div className="h-3 w-36 rounded bg-muted" />
      </div>
    </div>
  );
}
