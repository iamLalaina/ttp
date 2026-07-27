import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/cognito";
import { getRequestsForOwner } from "@/services/adoption.service";
import { RequestList } from "@/components/adoption/RequestList";

export const metadata: Metadata = {
  title: "Adoption Requests",
};

/**
 * /requests — Owner adoption requests inbox (Server Component)
 *
 * Shows all adoption requests for pets owned by the current user.
 */
export default async function RequestsPage() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    notFound();
  }

  const requests = await getRequestsForOwner(user.id);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Adoption Requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and manage adoption requests for your pets.
        </p>
      </div>

      <RequestList requests={requests} />
    </div>
  );
}
