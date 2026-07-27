import type { PetType } from "@/types/pet.types";
import { capitalize } from "@/utils/format";

// ---------------------------------------------------------------------------
// Status color mapping — single source of truth
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<PetType["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  adopted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

const SIZE_STYLES = {
  default: "px-2.5 py-0.5 text-xs",
  sm: "px-2 py-0.5 text-[10px]",
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetStatusBadgeProps {
  status: PetType["status"];
  /** @default "default" */
  size?: keyof typeof SIZE_STYLES;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared status badge for pet cards and detail views.
 * Server Component — no interactivity needed.
 *
 * Color mapping is centralized here. To add a new status, update
 * STATUS_STYLES in this single file.
 */
export function PetStatusBadge({
  status,
  size = "default",
  className = "",
}: PetStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${SIZE_STYLES[size]} ${STATUS_STYLES[status]} ${className}`}
    >
      {capitalize(status)}
    </span>
  );
}
