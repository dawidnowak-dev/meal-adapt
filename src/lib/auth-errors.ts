import type { AuthError } from "@supabase/supabase-js";

type AuthOperation = "signin" | "signup";

/** Must equal `minimum_password_length` in supabase/config.toml and in every remote Supabase project. */
export const MIN_PASSWORD_LENGTH = 6;

/** Codes carried in `?error=` — pages map them to fixed messages, so URL text is never rendered. */
export type AuthErrorCode = "invalid-credentials" | "account-exists" | "weak-password" | "not-configured" | "failed";

const MESSAGES: Record<Exclude<AuthErrorCode, "failed">, string> = {
  "invalid-credentials": "Nieprawidłowy e-mail lub hasło.",
  "account-exists": "Konto z tym adresem e-mail już istnieje.",
  "weak-password": `Hasło jest za słabe. Użyj co najmniej ${MIN_PASSWORD_LENGTH} znaków.`,
  "not-configured": "Brak konfiguracji Supabase.",
};

const GENERIC_MESSAGES: Record<AuthOperation, string> = {
  signin: "Nie udało się zalogować. Spróbuj ponownie później.",
  signup: "Nie udało się założyć konta. Spróbuj ponownie później.",
};

/** Maps a Supabase AuthError to an error code by its `code` (never by the raw English text). */
export function authErrorCode(error: Pick<AuthError, "code">): AuthErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "invalid-credentials";
    case "user_already_exists":
    case "email_exists":
      return "account-exists";
    case "weak_password":
      return "weak-password";
    default:
      return "failed";
  }
}

/** Polish message for an `?error=` value; unknown codes get the generic message, no code gets none. */
export function authErrorMessage(code: string | null, operation: AuthOperation): string | null {
  if (!code) return null;
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code as keyof typeof MESSAGES] : GENERIC_MESSAGES[operation];
}
