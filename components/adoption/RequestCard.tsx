import Image from "next/image";
import { PawPrint } from "lucide-react";
import type { AdoptionRequestWithPet } from "@/types/adoption.types";
import { formatDate, capitalize } from "@/utils/format";
import { RequestActions } from "@/components/adoption/RequestActions";

// ---------------------------------------------------------------------------
// Status badge for requests
// ---------------------------------------------------------------------------

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RequestCardProps {
  request: AdoptionRequestWithPet;
}

// ---------------------------------------------------------------------------
// RequestCard
// ---------------------------------------------------------------------------

/**
 * Displays a single adoption request in the owner's inbox.
 * Server Component — delegates interactivity to RequestActions.
 */
export function RequestCard({ request }: RequestCardProps) {
  return (
    <article className="flex gap-4 rounded-lg border border-border bg-card p-4">
      {/* Pet thumbnail */}
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {request.petPrimaryImageUrl ? (
          <Image
            src={request.petPrimaryImageUrl}
            alt={request.petName}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint className="size-6 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {request.applicantName}
            </p>
            <p className="text-xs text-muted-foreground">
              {request.applicantEmail}
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${REQUEST_STATUS_STYLES[request.status]}`}
          >
            {capitalize(request.status)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          For: <span className="font-medium text-foreground">{request.petName}</span>
          {" · "}
          {formatDate(request.createdAt)}
        </p>

        <p className="text-sm text-foreground line-clamp-2">
          {request.message}
        </p>

        {/* Actions (only for pending) */}
        <RequestActions requestId={request.id} currentStatus={request.status} />
      </div>
    </article>
  );
}
