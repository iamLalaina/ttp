import Link from "next/link";

export default function RescuerNotFound() {
  return (
    <div className="py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Rescuer not found</h1>
      <p className="text-sm text-muted-foreground">This rescuer profile doesn&apos;t exist.</p>
      <Link href="/catalog" className="inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80">
        Browse the catalog
      </Link>
    </div>
  );
}
