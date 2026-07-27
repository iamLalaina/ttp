/**
 * Standard API response envelope used by all Route Handlers in this project.
 *
 * Every endpoint returns exactly one of these two shapes:
 *   - Success: { data: T, error: null }
 *   - Error:   { data: null, error: { code, message } }
 */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };
