import { logServerError } from "@/lib/log";
import type { ApiErrorDTO } from "@/types";

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function errorResponse(status: number, code: string, message: string): Response {
  const body: ApiErrorDTO = { error: { code, message } };
  return jsonResponse(body, status);
}

export const unauthorized = () => errorResponse(401, "unauthorized", "Zaloguj się, aby zarządzać wykluczeniami.");

export const configMissing = () =>
  errorResponse(503, "config-missing", "Usługa jest chwilowo niedostępna. Spróbuj ponownie później.");

export function serverError(operation: string, error: unknown): Response {
  logServerError("api", operation, error);
  return errorResponse(500, "server-error", "Coś poszło nie tak. Spróbuj ponownie później.");
}
