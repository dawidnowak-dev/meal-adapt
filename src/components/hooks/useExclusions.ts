import { useCallback, useRef, useState } from "react";
import type { ApiErrorDTO, ExclusionDTO } from "@/types";

export type PendingAction = "adding" | "removing";

export type ExclusionsError = { kind: "message"; message: string } | { kind: "session-expired" };

const NETWORK_ERROR_MESSAGE = "Nie udało się zapisać zmian. Sprawdź połączenie i spróbuj ponownie.";
const FALLBACK_ERROR_MESSAGE = "Coś poszło nie tak. Spróbuj ponownie później.";

function isApiError(value: unknown): value is ApiErrorDTO {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const { error } = value;
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string";
}

function isExclusionBody(value: unknown): value is { exclusion: ExclusionDTO } {
  if (typeof value !== "object" || value === null || !("exclusion" in value)) return false;
  const { exclusion } = value;
  return typeof exclusion === "object" && exclusion !== null && "productId" in exclusion;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function toError(response: Response): Promise<ExclusionsError> {
  if (response.status === 401) return { kind: "session-expired" };
  const body = await readJson(response);
  return { kind: "message", message: isApiError(body) ? body.error.message : FALLBACK_ERROR_MESSAGE };
}

/** Server-confirmed exclusion state: the list changes only after the API responds, never optimistically. */
export function useExclusions(initialExclusions: ExclusionDTO[]) {
  const [exclusions, setExclusions] = useState<ExclusionDTO[]>(initialExclusions);
  const [pending, setPending] = useState<Partial<Record<string, PendingAction>>>({});
  const [error, setError] = useState<ExclusionsError | null>(null);
  // Synchronous guard against double clicks before the pending state re-renders.
  const inFlight = useRef(new Set<string>());

  const run = useCallback(
    async (productId: string, action: PendingAction, perform: () => Promise<ExclusionsError | null>) => {
      if (inFlight.current.has(productId)) return;
      inFlight.current.add(productId);
      setError(null);
      setPending((prev) => ({ ...prev, [productId]: action }));
      try {
        const failure = await perform();
        if (failure) setError(failure);
      } catch {
        setError({ kind: "message", message: NETWORK_ERROR_MESSAGE });
      } finally {
        inFlight.current.delete(productId);
        setPending((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== productId)));
      }
    },
    [],
  );

  const addExclusion = useCallback(
    (productId: string) =>
      run(productId, "adding", async () => {
        const response = await fetch("/api/exclusions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!response.ok) return toError(response);
        const body = await readJson(response);
        if (!isExclusionBody(body)) return { kind: "message", message: FALLBACK_ERROR_MESSAGE };
        // The server orders by created_at, so a new exclusion goes last; an existing one (200) is not duplicated.
        setExclusions((prev) =>
          prev.some((item) => item.productId === body.exclusion.productId) ? prev : [...prev, body.exclusion],
        );
        return null;
      }),
    [run],
  );

  const removeExclusion = useCallback(
    (productId: string) =>
      run(productId, "removing", async () => {
        const response = await fetch(`/api/exclusions/${encodeURIComponent(productId)}`, { method: "DELETE" });
        if (!response.ok) return toError(response);
        setExclusions((prev) => prev.filter((item) => item.productId !== productId));
        return null;
      }),
    [run],
  );

  return { exclusions, pending, error, addExclusion, removeExclusion };
}
