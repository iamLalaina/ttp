/**
 * Loading skeleton for /dashboard.
 *
 * Renders 6 skeleton cards matching the PetCardGrid layout
 * to prevent layout shift while data loads.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>

      {/* Quick actions placeholder */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>

      {/* Card grid skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border"
            >
              {/* Image placeholder */}
              <div className="aspect-[3/2] w-full bg-muted" />
              {/* Body placeholder */}
              <div className="space-y-2 p-3">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              {/* Footer placeholder */}
              <div className="flex gap-2 border-t border-border px-3 py-2">
                <div className="h-3 w-10 rounded bg-muted" />
                <div className="h-3 w-10 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
