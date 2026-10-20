import type { AuthError } from "@supabase/supabase-js";

export const AUTH_NOT_CONFIGURED_MESSAGE = "Brak konfiguracji Supabase.";

type AuthOperation = "signin" | "signup";

const GENERIC_MESSAGES: Record<AuthOperation, string> = {
  signin: "Nie udało się zalogować. Spróbuj ponownie później.",
  signup: "Nie udało się założyć konta. Spróbuj ponownie później.",
};

/** Maps a Supabase AuthError to a Polish, user-facing message by its `code` (never by the raw English text). */
export function authErrorMessage(error: Pick<AuthError, "code">, operation: AuthOperation): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Nieprawidłowy e-mail lub hasło.";
    case "user_already_exists":
    case "email_exists":
      return "Konto z tym adresem e-mail już istnieje.";
    case "weak_password":
      return "Hasło jest za słabe. Użyj co najmniej 6 znaków.";
    default:
      return GENERIC_MESSAGES[operation];
  }
}
