export default function RescuerProfileLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
      <div className="h-20 w-full rounded bg-muted" />
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            <div className="aspect-[3/2] w-full bg-muted" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
