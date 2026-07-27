import type { Metadata } from "next";
import Link from "next/link";
import { PetForm } from "@/components/pets/PetForm";

export const metadata: Metadata = {
  title: "Register a pet",
};

/**
 * /pets/new — Pet registration page (Server Component)
 *
 * Renders the page heading and the PetForm client component.
 * Protected by middleware — only accessible to authenticated users.
 */
export default function NewPetPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/dashboard" className="hover:text-foreground hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground" aria-current="page">
            Register a pet
          </li>
        </ol>
      </nav>

      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Register a pet
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below to create a draft profile. The pet won&apos;t
          be visible in the public catalog until you publish it.
        </p>
      </div>

      {/* Form */}
      <PetForm />
    </div>
  );
}
