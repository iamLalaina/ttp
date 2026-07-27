/**
 * Loading skeleton for /requests.
 */
export default function RequestsLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading requests">
      <div className="space-y-1">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg border border-border p-4">
            <div className="size-16 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
