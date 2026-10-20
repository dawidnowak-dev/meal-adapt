import type { SupabaseClient } from "@supabase/supabase-js";
import { getSelectableExclusions } from "@/lib/catalog/selectable-exclusions";
import type { ExclusionDTO } from "@/types";

const TABLE = "user_exclusions";
const COLUMNS = "product_id, created_at";

interface ExclusionRow {
  product_id: string;
  created_at: string;
}

/** Database failure surfaced to the API layer; carries no HTTP formatting. */
export class ExclusionServiceError extends Error {
  readonly code = "database-error";

  constructor(operation: string, cause: { code?: string; message: string }) {
    super(`user_exclusions ${operation} failed${cause.code ? ` (${cause.code})` : ""}: ${cause.message}`);
    this.name = "ExclusionServiceError";
  }
}

function toDTO(row: ExclusionRow): ExclusionDTO {
  const selectable = getSelectableExclusions().find((item) => item.id === row.product_id);
  return {
    productId: row.product_id,
    name: selectable?.name ?? row.product_id,
    supported: selectable !== undefined,
    createdAt: row.created_at,
  };
}

/** The user's exclusions ordered by created_at, then product_id. */
export async function listExclusions(supabase: SupabaseClient, userId: string): Promise<ExclusionDTO[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("product_id", { ascending: true })
    .overrideTypes<ExclusionRow[], { merge: false }>();
  if (error) throw new ExclusionServiceError("select", error);
  return data.map(toDTO);
}

/** Insert with on conflict do nothing; an existing exclusion yields created: false. */
export async function addExclusion(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
): Promise<{ exclusion: ExclusionDTO; created: boolean }> {
  // ignoreDuplicates issues INSERT ... ON CONFLICT DO NOTHING (no UPDATE; the table has no update policy).
  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true })
    .select(COLUMNS)
    .overrideTypes<ExclusionRow[], { merge: false }>();
  if (insertError) throw new ExclusionServiceError("insert", insertError);

  const createdRow = inserted.at(0);
  if (createdRow) return { exclusion: toDTO(createdRow), created: true };

  const { data: existing, error: selectError } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()
    .overrideTypes<ExclusionRow, { merge: false }>();
  if (selectError) throw new ExclusionServiceError("select existing", selectError);
  return { exclusion: toDTO(existing), created: false };
}

/** Idempotent: removing a missing row (or another account's row) is not an error. */
export async function removeExclusion(supabase: SupabaseClient, userId: string, productId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("user_id", userId).eq("product_id", productId);
  if (error) throw new ExclusionServiceError("delete", error);
}
