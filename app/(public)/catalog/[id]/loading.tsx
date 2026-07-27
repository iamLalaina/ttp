/**
 * Loading skeleton for /catalog/[id].
 *
 * Matches the PublicPetDetailView + PetImageGallery layout.
 */
export default function PublicPetDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading pet details">
      {/* Breadcrumb */}
      <div className="h-3 w-32 rounded bg-muted" />

      {/* Image placeholder */}
      <div className="aspect-[3/2] w-full rounded-lg bg-muted" />

      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 7 }).map((_, i) => (
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
    </div>
  );
}
