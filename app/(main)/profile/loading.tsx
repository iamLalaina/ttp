export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true">
      <div className="space-y-1">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-full rounded-lg bg-muted" />
        </div>
      ))}
      <div className="h-9 w-32 rounded-lg bg-muted" />
    </div>
  );
}
