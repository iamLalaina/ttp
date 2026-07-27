import { z } from "zod";

/**
 * Authentication validation schemas.
 * Uses Zod v4 API.
 */

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

const ERR_EMAIL_REQUIRED = "Email is required";
const ERR_EMAIL_INVALID = "Please enter a valid email address";
const ERR_PASSWORD_REQUIRED = "Password is required";
const ERR_PASSWORD_TOO_SHORT = "Password must be at least 8 characters";
const ERR_PASSWORD_PATTERN =
  "Password must contain at least one uppercase letter, one lowercase letter, and one number";
const ERR_CONFIRM_REQUIRED = "Please confirm your password";
const ERR_CODE_REQUIRED = "Verification code is required";
const ERR_CODE_LENGTH = "Code must be 6 characters";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Login form validation. */
export const loginSchema = z.object({
  email: z
    .string({ error: ERR_EMAIL_REQUIRED })
    .email(ERR_EMAIL_INVALID),
  password: z
    .string({ error: ERR_PASSWORD_REQUIRED })
    .min(8, ERR_PASSWORD_TOO_SHORT),
});

/** Registration form validation. */
export const registerSchema = z
  .object({
    email: z
      .string({ error: ERR_EMAIL_REQUIRED })
      .email(ERR_EMAIL_INVALID),
    password: z
      .string({ error: ERR_PASSWORD_REQUIRED })
      .min(8, ERR_PASSWORD_TOO_SHORT)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        ERR_PASSWORD_PATTERN,
      ),
    confirmPassword: z
      .string({ error: ERR_CONFIRM_REQUIRED })
      .min(1, ERR_CONFIRM_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Email verification form. */
export const verifySchema = z.object({
  email: z
    .string({ error: ERR_EMAIL_REQUIRED })
    .email(ERR_EMAIL_INVALID),
  code: z
    .string({ error: ERR_CODE_REQUIRED })
    .length(6, ERR_CODE_LENGTH),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
