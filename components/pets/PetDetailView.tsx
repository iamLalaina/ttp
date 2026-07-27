import Link from "next/link";
import type { PetType } from "@/types/pet.types";
import { formatAge, formatDate, capitalize, formatEnumLabel } from "@/utils/format";
import { PetStatusBadge } from "@/components/pets/PetStatusBadge";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetDetailViewProps {
  pet: PetType;
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PetDetailView
// ---------------------------------------------------------------------------

/**
 * Presentational Server Component that renders all fields of a pet record.
 * Receives a fully resolved PetType object — no data fetching here.
 */
export function PetDetailView({ pet }: PetDetailViewProps) {
  return (
    <article className="space-y-8">
      {/* Header — name, badge, actions */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {pet.name}
          </h1>
          <PetStatusBadge status={pet.status} />
        </div>

        <Link
          href={`/pets/${pet.id}/edit`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Edit
        </Link>
      </header>

      {/* Info grid */}
      <section aria-labelledby="info-heading">
        <h2 id="info-heading" className="sr-only">
          Pet information
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoItem label="Species" value={capitalize(pet.species)} />
          <InfoItem label="Breed" value={pet.breed} />
          <InfoItem label="Age" value={formatAge(pet.ageInMonths)} />
          <InfoItem label="Sex" value={capitalize(pet.sex)} />
          <InfoItem label="Size" value={capitalize(pet.size)} />
          <InfoItem
            label="Vaccination"
            value={formatEnumLabel(pet.vaccinationStatus)}
          />
          <InfoItem
            label="Sterilized"
            value={formatEnumLabel(pet.sterilized)}
          />
          <InfoItem
            label="Friendly with children"
            value={formatEnumLabel(pet.friendlyWithChildren)}
          />
          <InfoItem
            label="Friendly with animals"
            value={formatEnumLabel(pet.friendlyWithAnimals)}
          />
          <InfoItem label="Location" value={`${pet.city}, ${pet.state}`} />
        </dl>
      </section>

      {/* Health status */}
      <section aria-labelledby="health-heading" className="space-y-1.5">
        <h2
          id="health-heading"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Health status
        </h2>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {pet.healthStatus}
        </p>
      </section>

      {/* Description */}
      <section aria-labelledby="description-heading" className="space-y-1.5">
        <h2
          id="description-heading"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Description
        </h2>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {pet.description}
        </p>
      </section>

      {/* Footer — creation date */}
      <footer className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Registered on {formatDate(pet.createdAt)}
        </p>
      </footer>
    </article>
  );
}
