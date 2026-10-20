import type { APIRoute } from "astro";
import { configMissing, errorResponse, serverError, unauthorized } from "@/lib/api-response";
import { removeExclusion } from "@/lib/services/exclusions";
import { createClient } from "@/lib/supabase";

export const prerender = false;

/** Same slug rule as the user_exclusions.product_id check constraint. */
const PRODUCT_ID_SLUG = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauthorized();
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return configMissing();

  // Selectability is deliberately not required: entries that left the catalog must stay removable.
  const productId = context.params.productId ?? "";
  if (!PRODUCT_ID_SLUG.test(productId)) {
    return errorResponse(400, "invalid-product-id", "Nieprawidłowy identyfikator produktu.");
  }

  try {
    await removeExclusion(supabase, user.id, productId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError("remove exclusion", error);
  }
};
