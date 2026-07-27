/**
 * Pure formatting utility functions.
 *
 * No external dependencies — only TypeScript built-ins.
 * All functions are side-effect-free and deterministic.
 */

/**
 * Converts an age in months to a human-readable string.
 *
 * @example formatAge(18)  → "1 year, 6 months"
 * @example formatAge(3)   → "3 months"
 * @example formatAge(24)  → "2 years"
 * @example formatAge(1)   → "1 month"
 * @example formatAge(12)  → "1 year"
 */
export function formatAge(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;

  const parts: string[] = [];

  if (years > 0) {
    parts.push(years === 1 ? "1 year" : `${years} years`);
  }

  if (months > 0) {
    parts.push(months === 1 ? "1 month" : `${months} months`);
  }

  return parts.length > 0 ? parts.join(", ") : "0 months";
}

/**
 * Formats a Date into a localized short date string (English).
 *
 * @example formatDate(new Date("2026-07-27")) → "Jul 27, 2026"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Capitalizes the first letter of a string.
 *
 * @example capitalize("dog")    → "Dog"
 * @example capitalize("female") → "Female"
 * @example capitalize("")       → ""
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a snake_case enum value to a human-readable label.
 * Replaces underscores with spaces and capitalizes the first letter.
 *
 * @example formatEnumLabel("up_to_date") → "Up to date"
 * @example formatEnumLabel("partial")    → "Partial"
 * @example formatEnumLabel("unknown")    → "Unknown"
 */
export function formatEnumLabel(value: string): string {
  return capitalize(value.replace(/_/g, " "));
}
