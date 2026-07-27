import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s — TTP",
    default: "TTP — Tracing Tiny Paws",
  },
};

/**
 * Layout for public-facing routes (catalog, landing page).
 * Provides a minimal header without authenticated navigation.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80"
          >
            🐾 TTP
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground">
              Catalog
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
