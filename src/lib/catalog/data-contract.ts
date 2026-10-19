import catalogData from "../../data/meal-catalog.v1.json";
import type { CatalogData } from "./types";

/** Check the real repository JSON against the public contract without casts. */
export const mealCatalog: CatalogData = catalogData;
