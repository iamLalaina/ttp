import Link from "next/link";

/**
 * Minimal centered layout for auth pages (login, register).
 * No authenticated navigation.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="block text-center text-lg font-semibold tracking-tight text-foreground"
        >
          🐾 Tracing Tiny Paws
        </Link>
        {children}
      </div>
    </div>
  );
}
