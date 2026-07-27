/**
 * Loading skeleton for /pets/[id]/edit.
 *
 * Matches the edit form layout to prevent layout shift.
 */
export default function EditPetLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading edit form">
      {/* Breadcrumb */}
      <div className="h-3 w-48 rounded bg-muted" />

      {/* Heading */}
      <div className="space-y-1">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>

      {/* Form fields skeleton */}
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-4">
          <div className="h-5 w-32 rounded bg-muted" />
          {Array.from({ length: 4 }).map((_, field) => (
            <div key={field} className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-8 w-full rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      ))}

      {/* Submit button */}
      <div className="h-9 w-32 rounded-lg bg-muted" />
    </div>
  );
}
