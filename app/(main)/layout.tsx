import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: {
    template: "%s — TTP",
    default: "TTP — Tracing Tiny Paws",
  },
};

/**
 * Layout for authenticated (main) routes.
 * Provides the application shell with top navigation.
 * TODO: Replace placeholder nav with full Navbar component (future spec).
 */
export default function MainLayout({
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
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/requests" className="hover:text-foreground">
              Requests
            </Link>
            <Link href="/pets/new" className="hover:text-foreground">
              Register pet
            </Link>
            <Link href="/pets/new" className="hover:text-foreground">
              Register pet
            </Link>
            <Link href="/catalog" className="hover:text-foreground">
              Catalog
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
