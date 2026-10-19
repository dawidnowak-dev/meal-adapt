import catalogData from "../../data/meal-catalog.v1.json";
import casesData from "../../data/meal-catalog-cases.v1.json";
import type { CatalogCaseSet, CatalogData } from "./types";

/** Check the real repository JSON against the public contract without casts. */
export const mealCatalog: CatalogData = catalogData;

/** Acceptance examples for the same catalog version, checked the same way. */
export const mealCatalogCases: CatalogCaseSet = casesData;
