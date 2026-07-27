import type { PublicPetDetail } from "@/types/pet.types";
import { formatAge, formatDate, capitalize, formatEnumLabel } from "@/utils/format";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PublicPetDetailViewProps {
  pet: PublicPetDetail;
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
// PublicPetDetailView
// ---------------------------------------------------------------------------

/**
 * Presentational Server Component that renders public-facing pet details.
 * No Edit links, no management controls, no ownerId.
 */
export function PublicPetDetailView({ pet }: PublicPetDetailViewProps) {
  return (
    <article className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {pet.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {capitalize(pet.species)} &middot; {pet.breed} &middot;{" "}
          {formatAge(pet.ageInMonths)}
        </p>
      </header>

      {/* Info grid */}
      <section aria-labelledby="public-info-heading">
        <h2 id="public-info-heading" className="sr-only">
          Pet information
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <section aria-labelledby="public-health-heading" className="space-y-1.5">
        <h2
          id="public-health-heading"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Health status
        </h2>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {pet.healthStatus}
        </p>
      </section>

      {/* Description */}
      <section aria-labelledby="public-description-heading" className="space-y-1.5">
        <h2
          id="public-description-heading"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          About {pet.name}
        </h2>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {pet.description}
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Listed on {formatDate(pet.createdAt)}
        </p>
      </footer>
    </article>
  );
}
