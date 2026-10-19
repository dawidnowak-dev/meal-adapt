/**
 * Repository JSON boundary. String values (slugs, units, operation names and
 * statuses), graph integrity and template applicability are checked separately
 * by the catalog integrity checker; JSON imports widen literal strings.
 */
export interface CatalogSource {
  title: string;
  url: string;
  accessedOn: string;
}

export interface CatalogReview {
  /** A proposal remains pending until the owner's separate, hash-bound review. */
  status: string;
  basis: string;
  exclusionIds: string[];
  sources: CatalogSource[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  aliases: string[];
  /** Directed composition edges; identity itself also constitutes a conflict. */
  contains: string[];
  profile: {
    description: string;
    review: CatalogReview;
  };
}

export interface CatalogKnownIngredient {
  /** Stable recipe-local identity, preserved when its product is substituted. */
  id: string;
  productId: string;
  amount: number;
  unit: string;
  name?: never;
}

/** An unresolved name is not a fabricated catalog product reference. */
export interface CatalogUnknownIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  productId?: never;
}

export type CatalogIngredient = CatalogKnownIngredient | CatalogUnknownIngredient;

export interface CatalogStepParameter {
  /** Placeholder in text, enclosed in braces, e.g. {milkAmount}. */
  name: string;
  ingredientId: string;
  /** amount, unit or productName, resolved from the resulting ingredient list. */
  field: string;
}

export interface CatalogRecipeStep {
  id: string;
  text: string;
  ingredientIds: string[];
  parameters: CatalogStepParameter[];
}

export interface CatalogRecipe {
  id: string;
  context: string;
  templateId: string;
  templateVersion: number;
  ingredients: CatalogIngredient[];
  steps: CatalogRecipeStep[];
}

export interface CatalogInstructionChange {
  /** insert-before or replace; array order is execution order. */
  operation: string;
  /** Anchor in the original, unchanged reference template. */
  stepId: string;
  step: CatalogRecipeStep;
}

export interface CatalogSubstitution {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  context: string;
  /** Also requires exact reference-step structure; ids alone are insufficient. */
  appliesTo: {
    templateId: string;
    templateVersion: number;
  };
  /** Lower positive values are tried first, unique per source/context. */
  priority: number;
  quantity: {
    fromAmount: number;
    fromUnit: string;
    toAmount: number;
    toUnit: string;
  };
  instructionChanges: CatalogInstructionChange[];
}

export interface CatalogData {
  schemaVersion: number;
  catalogVersion: number;
  selectableExclusionIds: string[];
  products: CatalogProduct[];
  substitutions: CatalogSubstitution[];
  referenceRecipe: CatalogRecipe;
  referenceRecipeReview: CatalogReview;
}

export interface CatalogConflict {
  ingredientId: string;
  exclusionId: string;
  /** Starts with the ingredient product and ends with the excluded product. */
  path: string[];
}

/** Test-only removals never mutate the catalog's active substitutions. */
export interface CatalogTestOnlyOverlay {
  substitutions: {
    substitutionId: string;
    removeFields: string[];
  }[];
}

export interface CatalogCase {
  id: string;
  caseKind: string;
  catalogVersion: number;
  recipe: CatalogRecipe;
  exclusionIds: string[];
  testOnlyOverlay?: CatalogTestOnlyOverlay;
  templateMismatch?: string;
  expected: {
    outcome: string;
    reason: string;
    conflicts: CatalogConflict[];
    substitutionIds: string[];
    /** Complete unchanged or substituted recipe; omitted for rejection. */
    recipe?: CatalogRecipe;
  };
}
