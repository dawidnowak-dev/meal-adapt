// Type-only import: this module must not pull the catalog JSON into the client bundle.
import type { SelectableExclusion } from "./selectable-exclusions";

/** NFC, trimmed, collapsed whitespace and lower case; Polish letters are preserved. */
export function normalizeCatalogName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

export interface ExclusionSearchResult {
  matches: SelectableExclusion[];
  /** True when no normalized name or alias equals the query exactly. */
  isUnsupported: boolean;
}

export function searchExclusions(query: string, items: readonly SelectableExclusion[]): ExclusionSearchResult {
  const normalizedQuery = normalizeCatalogName(query);
  if (normalizedQuery === "") {
    return { matches: [...items], isUnsupported: false };
  }

  let hasExactMatch = false;
  const matches = items.filter((item) => {
    const names = [item.name, ...item.aliases].map(normalizeCatalogName);
    if (names.includes(normalizedQuery)) {
      hasExactMatch = true;
    }
    return names.some((name) => name.includes(normalizedQuery));
  });

  return { matches, isUnsupported: !hasExactMatch };
}
