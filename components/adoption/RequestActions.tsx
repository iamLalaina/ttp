"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api.types";
import type { AdoptionRequestType } from "@/types/adoption.types";

interface RequestActionsProps {
  requestId: string;
  currentStatus: string;
}

/**
 * Accept/Reject buttons for a pending adoption request.
 * Client Component — requires interactivity for API calls.
 */
export function RequestActions({ requestId, currentStatus }: RequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (currentStatus !== "pending") return null;

  async function handleAction(status: "accepted" | "rejected") {
    if (status === "accepted") {
      const confirmed = window.confirm(
        "This will mark the pet as adopted and reject all other pending requests. Continue?",
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/adoption-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result: ApiResponse<AdoptionRequestType> = await res.json();

      if (res.ok && !result.error) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="default"
        disabled={loading}
        onClick={() => handleAction("accepted")}
      >
        {loading ? "…" : "Accept"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => handleAction("rejected")}
      >
        {loading ? "…" : "Reject"}
      </Button>
    </div>
  );
}
