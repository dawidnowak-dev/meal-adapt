import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { configMissing, errorResponse, jsonResponse, serverError, unauthorized } from "@/lib/api-response";
import { isSelectableExclusionId } from "@/lib/catalog/selectable-exclusions";
import { addExclusion, listExclusions } from "@/lib/services/exclusions";
import { createClient } from "@/lib/supabase";
import type { AddExclusionCommand, ExclusionListDTO } from "@/types";

export const prerender = false;

const addExclusionSchema = z.object({ productId: z.string() });

export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauthorized();
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return configMissing();

  try {
    const body: ExclusionListDTO = { exclusions: await listExclusions(supabase, user.id) };
    return jsonResponse(body);
  } catch (error) {
    return serverError("list exclusions", error);
  }
};

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauthorized();
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return configMissing();

  // CSRF boundary: Astro's checkOrigin ignores non-form content types, so only JSON is accepted here.
  const mediaType = (context.request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return errorResponse(415, "unsupported-media-type", "Żądanie musi być w formacie JSON.");
  }

  let command: AddExclusionCommand;
  try {
    const parsed = addExclusionSchema.safeParse(await context.request.json());
    if (!parsed.success) throw parsed.error;
    command = parsed.data;
  } catch {
    return errorResponse(400, "invalid-body", "Nieprawidłowe dane żądania.");
  }

  if (!isSelectableExclusionId(command.productId)) {
    return errorResponse(
      400,
      "unsupported-product",
      "Ten produkt nie jest obsługiwanym wykluczeniem i nie zostanie uwzględniony.",
    );
  }

  try {
    const { exclusion, created } = await addExclusion(supabase, user.id, command.productId);
    return jsonResponse({ exclusion }, created ? 201 : 200);
  } catch (error) {
    return serverError("add exclusion", error);
  }
};
