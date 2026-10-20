import catalogData from "../../data/meal-catalog.v1.json";
import type { CatalogData } from "./types";

/** A catalog product the user may choose as an exclusion. */
export interface SelectableExclusion {
  id: string;
  name: string;
  aliases: string[];
}

const catalog: CatalogData = catalogData;

const selectableExclusions: readonly SelectableExclusion[] = catalog.selectableExclusionIds.map((id) => {
  const product = catalog.products.find((candidate) => candidate.id === id);
  if (!product) {
    throw new Error(`Selectable exclusion ${id} is missing from the catalog products`);
  }
  return { id: product.id, name: product.name, aliases: [...product.aliases] };
});

const selectableById = new Map(selectableExclusions.map((item) => [item.id, item]));

/** Server-only: selectable exclusions in `selectableExclusionIds` order. */
export function getSelectableExclusions(): SelectableExclusion[] {
  return selectableExclusions.map((item) => ({ ...item, aliases: [...item.aliases] }));
}

/** Server-only: the selectable exclusion with this id, without copying the list. */
export function findSelectableExclusion(id: string): Readonly<SelectableExclusion> | undefined {
  return selectableById.get(id);
}

export function isSelectableExclusionId(id: string): boolean {
  return selectableById.has(id);
}
