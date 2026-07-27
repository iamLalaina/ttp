/**
 * Loading skeleton for /catalog.
 *
 * Renders 6 skeleton cards matching the CatalogGrid layout.
 */
export default function CatalogLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading catalog">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      {/* Grid heading */}
      <div className="space-y-4">
        <div className="h-3 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border"
            >
              <div className="aspect-[3/2] w-full bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </div>
              <div className="border-t border-border px-3 py-2">
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
