import { PawPrint } from "lucide-react";
import type { AdoptionRequestWithPet } from "@/types/adoption.types";
import { RequestCard } from "@/components/adoption/RequestCard";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RequestListProps {
  requests: AdoptionRequestWithPet[];
}

// ---------------------------------------------------------------------------
// RequestList
// ---------------------------------------------------------------------------

/**
 * Renders a list of adoption request cards or an empty state.
 * Server Component — no interactivity needed at this level.
 */
export function RequestList({ requests }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <PawPrint className="size-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            No adoption requests yet
          </p>
          <p className="text-xs text-muted-foreground">
            Your published pets will receive requests from potential adopters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <RequestCard key={req.id} request={req} />
      ))}
    </div>
  );
}
