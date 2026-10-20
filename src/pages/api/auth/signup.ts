import type { APIRoute } from "astro";
import { AUTH_NOT_CONFIGURED_MESSAGE, authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase";

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect(`/auth/signup?error=${encodeURIComponent(AUTH_NOT_CONFIGURED_MESSAGE)}`);
  }
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return context.redirect(`/auth/signup?error=${encodeURIComponent(authErrorMessage(error, "signup"))}`);
  }

  return context.redirect("/auth/confirm-email");
};
