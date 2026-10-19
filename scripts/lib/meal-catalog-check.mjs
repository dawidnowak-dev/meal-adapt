// Integrity check for the meal catalog and its acceptance cases.
// Pure: no file IO, no network and no mutation of the arguments. It checks data shape, references, names,
// the contains graph and the completeness of expected results; it never applies substitution rules.

export const SUPPORTED_SCHEMA_VERSION = 1;
export const SELECTABLE_EXCLUSION_IDS = ["cow-milk", "wheat", "walnut", "pea"];
export const SUPPORTED_CONTEXTS = ["crepes"];
export const INSTRUCTION_OPERATIONS = ["insert-before", "replace"];
export const STEP_PARAMETER_FIELDS = ["amount", "unit", "productName"];
export const OUTCOMES = ["accepted", "substituted", "rejected"];
export const REASONS_BY_OUTCOME = {
  accepted: ["no-conflict"],
  substituted: ["conflict-resolved"],
  rejected: ["unresolved-conflict", "unknown-ingredient"],
};
export const SKIP_REASONS = [
  "target-conflict",
  "incomplete-rule",
  "context-mismatch",
  "template-mismatch",
  "unit-mismatch",
];
export const OVERLAY_REMOVABLE_FIELDS = ["quantity", "instructionChanges"];
export const TEMPLATE_MISMATCH_KINDS = [
  "template-id",
  "template-version",
  "missing-anchor",
  "duplicate-step-id",
  "changed-step-text",
];
export const REQUIRED_CASE_KINDS = [
  "compatible-unchanged",
  "substitution-first-candidate",
  "substitution-fallback",
  "indirect-conflict-rejected",
  "direct-conflict-rejected",
  "unknown-ingredient",
  "ambiguous-name",
  "incomplete-rule-quantity",
  "incomplete-rule-instructions",
  "context-mismatch",
  "unit-mismatch",
  "template-mismatch",
  "full-revalidation",
];
/** Expected skip reason for every candidate rule, per case kind that rejects all candidates. */
const ALL_CANDIDATES_SKIPPED = {
  "incomplete-rule-quantity": "incomplete-rule",
  "incomplete-rule-instructions": "incomplete-rule",
  "context-mismatch": "context-mismatch",
  "unit-mismatch": "unit-mismatch",
  "template-mismatch": "template-mismatch",
};
const OVERLAY_FIELD_BY_KIND = {
  "incomplete-rule-quantity": "quantity",
  "incomplete-rule-instructions": "instructionChanges",
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

/** NFC, trimmed, collapsed whitespace and lower case; Polish letters are preserved. */
export function normalizeName(value) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
const isPositiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every((v) => b.includes(v));

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function placeholders(text) {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]);
}

function sameStep(a, b) {
  return (
    a.id === b.id &&
    a.text === b.text &&
    JSON.stringify(a.ingredientIds) === JSON.stringify(b.ingredientIds) &&
    JSON.stringify(a.parameters) === JSON.stringify(b.parameters)
  );
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
    );
  }
  return false;
}

/**
 * @param {unknown} catalog parsed meal-catalog JSON
 * @param {unknown} cases parsed meal-catalog-cases JSON
 * @returns {{ code: string, path: string, message: string }[]}
 */
export function checkCatalog(catalog, cases) {
  const diagnostics = [];
  const report = (code, path, message) => diagnostics.push({ code, path, message });

  function requireFields(value, path, fields) {
    if (!isObject(value)) {
      report("invalid-type", path, "Expected an object.");
      return false;
    }
    let complete = true;
    for (const [field, kind] of Object.entries(fields)) {
      const fieldValue = value[field];
      const ok =
        kind === "array"
          ? Array.isArray(fieldValue)
          : kind === "object"
            ? isObject(fieldValue)
            : typeof fieldValue === kind;
      if (!ok) {
        report(
          fieldValue === undefined ? "missing-field" : "invalid-type",
          `${path}.${field}`,
          `Field ${field} must be ${kind}.`,
        );
        complete = false;
      }
    }
    return complete;
  }

  function requireSlug(value, path) {
    if (typeof value === "string" && !SLUG.test(value)) report("invalid-id", path, `"${value}" is not a stable slug.`);
  }

  function checkReview(review, path) {
    if (!requireFields(review, path, { status: "string", basis: "string", exclusionIds: "array", sources: "array" })) {
      return;
    }
    if (!isNonEmptyString(review.status)) report("empty-field", `${path}.status`, "Review status must not be empty.");
    if (!isNonEmptyString(review.basis)) report("empty-field", `${path}.basis`, "Review basis must not be empty.");
    if (!sameSet(review.exclusionIds, SELECTABLE_EXCLUSION_IDS)) {
      report("review-exclusions", `${path}.exclusionIds`, "Review must cover exactly the four selectable exclusions.");
    }
    review.sources.forEach((source, index) => {
      const sourcePath = `${path}.sources[${index}]`;
      if (!requireFields(source, sourcePath, { title: "string", url: "string", accessedOn: "string" })) return;
      if (!/^https:\/\//.test(source.url)) report("invalid-source", `${sourcePath}.url`, "Source url must be https.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) {
        report("invalid-source", `${sourcePath}.accessedOn`, "accessedOn must be YYYY-MM-DD.");
      }
    });
  }

  // ---- Catalog --------------------------------------------------------------------------------------------------

  if (
    !requireFields(catalog, "catalog", {
      schemaVersion: "number",
      catalogVersion: "number",
      selectableExclusionIds: "array",
      products: "array",
      substitutions: "array",
      referenceRecipe: "object",
      referenceRecipeReview: "object",
    })
  ) {
    return diagnostics;
  }

  if (catalog.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    report("unsupported-version", "catalog.schemaVersion", `Supported schemaVersion is ${SUPPORTED_SCHEMA_VERSION}.`);
  }
  if (!isPositiveInteger(catalog.catalogVersion)) {
    report("invalid-version", "catalog.catalogVersion", "catalogVersion must be a positive integer.");
  }
  if (!sameSet(catalog.selectableExclusionIds, SELECTABLE_EXCLUSION_IDS)) {
    report(
      "selectable-exclusions",
      "catalog.selectableExclusionIds",
      `Selectable exclusions must be exactly: ${SELECTABLE_EXCLUSION_IDS.join(", ")}.`,
    );
  }

  /** @type {Map<string, any>} */
  const products = new Map();
  /** normalized name -> product id */
  const names = new Map();
  catalog.products.forEach((product, index) => {
    const path = `catalog.products[${index}]`;
    if (
      !requireFields(product, path, {
        id: "string",
        name: "string",
        aliases: "array",
        contains: "array",
        profile: "object",
      })
    ) {
      return;
    }
    requireSlug(product.id, `${path}.id`);
    if (products.has(product.id)) report("duplicate-id", `${path}.id`, `Duplicate product id "${product.id}".`);
    else products.set(product.id, product);

    [product.name, ...product.aliases].forEach((name, nameIndex) => {
      const namePath = nameIndex === 0 ? `${path}.name` : `${path}.aliases[${nameIndex - 1}]`;
      if (!isNonEmptyString(name)) {
        report("empty-name", namePath, "Names and aliases must be non-empty strings.");
        return;
      }
      const normalized = normalizeName(name);
      const owner = names.get(normalized);
      if (owner !== undefined && owner !== product.id) {
        report("ambiguous-name", namePath, `"${normalized}" already identifies product "${owner}".`);
      } else {
        names.set(normalized, product.id);
      }
    });

    if (requireFields(product.profile, `${path}.profile`, { description: "string", review: "object" })) {
      if (!isNonEmptyString(product.profile.description)) {
        report("empty-field", `${path}.profile.description`, "Profile description must not be empty.");
      }
      checkReview(product.profile.review, `${path}.profile.review`);
    }
  });

  for (const id of catalog.selectableExclusionIds) {
    if (!products.has(id)) {
      report("unknown-reference", "catalog.selectableExclusionIds", `Exclusion "${id}" is not a catalog product.`);
    }
  }

  catalog.products.forEach((product, index) => {
    if (!isObject(product) || !Array.isArray(product.contains)) return;
    for (const id of duplicates(product.contains)) {
      report("duplicate-reference", `catalog.products[${index}].contains`, `"${id}" is listed more than once.`);
    }
    product.contains.forEach((id, edgeIndex) => {
      const path = `catalog.products[${index}].contains[${edgeIndex}]`;
      if (id === product.id) report("self-reference", path, `Product "${id}" cannot contain itself.`);
      else if (!products.has(id)) report("unknown-reference", path, `Product "${id}" does not exist.`);
    });
  });

  const edges = (id) => (products.get(id)?.contains ?? []).filter((next) => products.has(next) && next !== id);

  // Cycle detection: every node is expanded once (white/grey/black colouring).
  const colour = new Map();
  const cyclic = new Set();
  for (const start of products.keys()) {
    if (colour.has(start)) continue;
    const stack = [[start, 0]];
    const trail = [start];
    colour.set(start, "grey");
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const next = edges(frame[0])[frame[1]];
      frame[1] += 1;
      if (next === undefined) {
        colour.set(frame[0], "black");
        stack.pop();
        trail.pop();
      } else if (colour.get(next) === "grey") {
        const cycle = [...trail.slice(trail.indexOf(next)), next];
        const key = [...cycle.slice(0, -1)].sort().join(",");
        if (!cyclic.has(key)) {
          cyclic.add(key);
          report("contains-cycle", "catalog.products", `Cycle in contains: ${cycle.join(" -> ")}.`);
        }
      } else if (!colour.has(next)) {
        colour.set(next, "grey");
        stack.push([next, 0]);
        trail.push(next);
      }
    }
  }

  // Memoized reachability over the (possibly cyclic) graph; each node's closure is computed once.
  const closures = new Map();
  function reachable(id) {
    if (closures.has(id)) return closures.get(id);
    const seen = new Set([id]);
    const queue = [id];
    while (queue.length > 0) {
      for (const next of edges(queue.shift())) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    closures.set(id, seen);
    return seen;
  }

  /** A path is valid when it walks explicit contains edges from `from` and ends at `to`. */
  function isContainsPath(path, from, to) {
    if (!Array.isArray(path) || path.length === 0 || path[0] !== from || path[path.length - 1] !== to) return false;
    return path.every((id, index) => index === 0 || edges(path[index - 1]).includes(id));
  }

  function checkStep(step, path, ingredientIds) {
    if (!requireFields(step, path, { id: "string", text: "string", ingredientIds: "array", parameters: "array" })) {
      return false;
    }
    requireSlug(step.id, `${path}.id`);
    if (!isNonEmptyString(step.text)) report("empty-field", `${path}.text`, "Step text must not be empty.");
    if (step.ingredientIds.length === 0) report("empty-field", `${path}.ingredientIds`, "Step must use an ingredient.");
    for (const id of duplicates(step.ingredientIds)) {
      report("duplicate-reference", `${path}.ingredientIds`, `Ingredient "${id}" is listed more than once.`);
    }
    step.ingredientIds.forEach((id, index) => {
      if (!ingredientIds.has(id)) {
        report("unknown-ingredient-reference", `${path}.ingredientIds[${index}]`, `Recipe has no ingredient "${id}".`);
      }
    });
    const used = typeof step.text === "string" ? placeholders(step.text) : [];
    const declared = [];
    step.parameters.forEach((parameter, index) => {
      const parameterPath = `${path}.parameters[${index}]`;
      if (!requireFields(parameter, parameterPath, { name: "string", ingredientId: "string", field: "string" })) return;
      declared.push(parameter.name);
      if (!step.ingredientIds.includes(parameter.ingredientId)) {
        report("unknown-ingredient-reference", `${parameterPath}.ingredientId`, "Parameter ingredient is not in step.");
      }
      if (!STEP_PARAMETER_FIELDS.includes(parameter.field)) {
        report(
          "unsupported-field",
          `${parameterPath}.field`,
          `Field must be one of ${STEP_PARAMETER_FIELDS.join(", ")}.`,
        );
      }
      if (!used.includes(parameter.name)) {
        report("unused-parameter", `${parameterPath}.name`, `{${parameter.name}} does not appear in the step text.`);
      }
    });
    for (const name of duplicates(declared)) report("duplicate-parameter", `${path}.parameters`, `{${name}} repeats.`);
    for (const name of used) {
      if (!declared.includes(name)) report("undefined-placeholder", `${path}.text`, `{${name}} has no parameter.`);
    }
    return true;
  }

  /**
   * Checks a complete recipe. `allowDuplicateStepIds` is only granted to an explicit template-mismatch example.
   * Returns the ingredient list for further checks, or null when the recipe shape is unusable.
   */
  function checkRecipe(recipe, path, { allowUnknown, allowDuplicateStepIds = false }) {
    if (
      !requireFields(recipe, path, {
        id: "string",
        context: "string",
        templateId: "string",
        templateVersion: "number",
        ingredients: "array",
        steps: "array",
      })
    ) {
      return false;
    }
    requireSlug(recipe.id, `${path}.id`);
    requireSlug(recipe.context, `${path}.context`);
    requireSlug(recipe.templateId, `${path}.templateId`);
    if (!isPositiveInteger(recipe.templateVersion)) {
      report("invalid-version", `${path}.templateVersion`, "templateVersion must be a positive integer.");
    }
    if (recipe.ingredients.length === 0) report("empty-field", `${path}.ingredients`, "Recipe needs ingredients.");
    if (recipe.steps.length === 0) report("empty-field", `${path}.steps`, "Recipe needs steps.");

    const ingredientIds = new Set();
    recipe.ingredients.forEach((ingredient, index) => {
      const ingredientPath = `${path}.ingredients[${index}]`;
      if (!requireFields(ingredient, ingredientPath, { id: "string", amount: "number", unit: "string" })) return;
      requireSlug(ingredient.id, `${ingredientPath}.id`);
      if (ingredientIds.has(ingredient.id)) {
        report("duplicate-id", `${ingredientPath}.id`, `Duplicate ingredient id "${ingredient.id}".`);
      }
      ingredientIds.add(ingredient.id);
      if (!isPositiveNumber(ingredient.amount)) {
        report("non-positive-amount", `${ingredientPath}.amount`, "Ingredient amount must be positive.");
      }
      if (!isNonEmptyString(ingredient.unit))
        report("empty-field", `${ingredientPath}.unit`, "Unit must not be empty.");
      const hasProduct = Object.hasOwn(ingredient, "productId");
      const hasName = Object.hasOwn(ingredient, "name");
      if (hasProduct === hasName) {
        report("invalid-ingredient", ingredientPath, "Ingredient needs exactly one of productId or name.");
      } else if (hasProduct) {
        if (!products.has(ingredient.productId)) {
          report("unknown-product", `${ingredientPath}.productId`, `Product "${ingredient.productId}" does not exist.`);
        }
      } else if (!allowUnknown) {
        report(
          "unexpected-unknown-ingredient",
          `${ingredientPath}.name`,
          "Only acceptance cases may hold unknown names.",
        );
      } else if (!isNonEmptyString(ingredient.name)) {
        report("empty-name", `${ingredientPath}.name`, "Unknown ingredient name must not be empty.");
      } else if (names.has(normalizeName(ingredient.name))) {
        report(
          "unknown-name-is-known",
          `${ingredientPath}.name`,
          `"${ingredient.name}" identifies "${names.get(normalizeName(ingredient.name))}"; use productId.`,
        );
      }
    });

    const stepIds = [];
    recipe.steps.forEach((step, index) => {
      if (checkStep(step, `${path}.steps[${index}]`, ingredientIds)) stepIds.push(step.id);
    });
    if (!allowDuplicateStepIds) {
      for (const id of duplicates(stepIds)) report("duplicate-step-id", `${path}.steps`, `Step id "${id}" repeats.`);
    }
    for (const id of ingredientIds) {
      if (
        !recipe.steps.some(
          (step) => isObject(step) && Array.isArray(step.ingredientIds) && step.ingredientIds.includes(id),
        )
      ) {
        report("unused-ingredient", `${path}.ingredients`, `Ingredient "${id}" is not used by any step.`);
      }
    }
    return true;
  }

  const reference = catalog.referenceRecipe;
  const referenceOk = checkRecipe(reference, "catalog.referenceRecipe", { allowUnknown: false });
  if (referenceOk && !SUPPORTED_CONTEXTS.includes(reference.context)) {
    report("unsupported-context", "catalog.referenceRecipe.context", "Reference recipe context must be crepes.");
  }
  checkReview(catalog.referenceRecipeReview, "catalog.referenceRecipeReview");
  const referenceSteps = referenceOk ? reference.steps.filter(isObject) : [];
  const referenceStepIds = new Set(referenceSteps.map((step) => step.id));
  const referenceIngredientIds = new Set(
    referenceOk ? reference.ingredients.filter(isObject).map((ingredient) => ingredient.id) : [],
  );

  /** @type {Map<string, any>} */
  const substitutions = new Map();
  const priorities = new Map();
  catalog.substitutions.forEach((rule, index) => {
    const path = `catalog.substitutions[${index}]`;
    if (
      !requireFields(rule, path, {
        id: "string",
        sourceProductId: "string",
        targetProductId: "string",
        context: "string",
        appliesTo: "object",
        priority: "number",
        quantity: "object",
        instructionChanges: "array",
      })
    ) {
      if (isObject(rule) && typeof rule.id === "string") substitutions.set(rule.id, rule);
      return;
    }
    requireSlug(rule.id, `${path}.id`);
    if (substitutions.has(rule.id)) report("duplicate-id", `${path}.id`, `Duplicate substitution id "${rule.id}".`);
    else substitutions.set(rule.id, rule);

    for (const field of ["sourceProductId", "targetProductId"]) {
      if (!products.has(rule[field]))
        report("unknown-reference", `${path}.${field}`, `"${rule[field]}" does not exist.`);
    }
    if (rule.sourceProductId === rule.targetProductId) {
      report("invalid-substitution", `${path}.targetProductId`, "Target must differ from source.");
    } else if (products.has(rule.targetProductId) && reachable(rule.targetProductId).has(rule.sourceProductId)) {
      report("target-contains-source", `${path}.targetProductId`, "Target product contains the source product.");
    }
    if (!SUPPORTED_CONTEXTS.includes(rule.context)) {
      report("unsupported-context", `${path}.context`, `Context must be one of: ${SUPPORTED_CONTEXTS.join(", ")}.`);
    }
    if (referenceOk && rule.context !== reference.context) {
      report("context-mismatch", `${path}.context`, "Rule context differs from the reference recipe context.");
    }
    if (requireFields(rule.appliesTo, `${path}.appliesTo`, { templateId: "string", templateVersion: "number" })) {
      if (
        referenceOk &&
        (rule.appliesTo.templateId !== reference.templateId ||
          rule.appliesTo.templateVersion !== reference.templateVersion)
      ) {
        report(
          "applies-to-mismatch",
          `${path}.appliesTo`,
          `appliesTo must be ${reference.templateId}@${reference.templateVersion} (the reference template).`,
        );
      }
    }
    if (!isPositiveInteger(rule.priority)) {
      report("invalid-priority", `${path}.priority`, "Priority must be a positive integer.");
    } else {
      const key = `${rule.sourceProductId}\u0000${rule.context}\u0000${rule.priority}`;
      if (priorities.has(key)) {
        report("duplicate-priority", `${path}.priority`, `Priority ${rule.priority} repeats ${priorities.get(key)}.`);
      } else {
        priorities.set(key, rule.id);
      }
    }
    if (
      requireFields(rule.quantity, `${path}.quantity`, {
        fromAmount: "number",
        fromUnit: "string",
        toAmount: "number",
        toUnit: "string",
      })
    ) {
      const quantity = rule.quantity;
      if (!isPositiveNumber(quantity.fromAmount)) {
        report("non-positive-amount", `${path}.quantity.fromAmount`, "fromAmount must be positive.");
      }
      if (!isPositiveNumber(quantity.toAmount)) {
        report("non-positive-amount", `${path}.quantity.toAmount`, "toAmount must be positive.");
      }
      if (quantity.fromUnit !== "ml" || quantity.toUnit !== "ml") {
        report("unsupported-unit", `${path}.quantity`, "Active v1 rules support only ml -> ml.");
      } else if (quantity.fromAmount !== quantity.toAmount) {
        report("unsupported-ratio", `${path}.quantity`, "Active v1 rules support only a 1:1 ratio.");
      }
    }
    if (referenceOk) {
      const sourceInReference = reference.ingredients.some(
        (ingredient) => isObject(ingredient) && ingredient.productId === rule.sourceProductId,
      );
      if (!sourceInReference) {
        report("source-not-in-template", `${path}.sourceProductId`, "Source product is absent from the template.");
      }
    }
    if (rule.instructionChanges.length === 0) {
      report("empty-instructions", `${path}.instructionChanges`, "Active rule needs instruction changes.");
    }
    const sourceNames = products.has(rule.sourceProductId)
      ? [products.get(rule.sourceProductId).name, ...products.get(rule.sourceProductId).aliases]
          .filter(isNonEmptyString)
          .map(normalizeName)
      : [];
    const insertedIds = [];
    rule.instructionChanges.forEach((change, changeIndex) => {
      const changePath = `${path}.instructionChanges[${changeIndex}]`;
      if (!requireFields(change, changePath, { operation: "string", stepId: "string", step: "object" })) return;
      if (!INSTRUCTION_OPERATIONS.includes(change.operation)) {
        report("unsupported-operation", `${changePath}.operation`, `Use ${INSTRUCTION_OPERATIONS.join(" or ")}.`);
      }
      if (referenceOk && !referenceStepIds.has(change.stepId)) {
        report("unknown-step", `${changePath}.stepId`, `Reference template has no step "${change.stepId}".`);
      }
      if (!checkStep(change.step, `${changePath}.step`, referenceIngredientIds)) return;
      if (change.operation === "replace" && change.step.id !== change.stepId) {
        report("replace-id-mismatch", `${changePath}.step.id`, "A replacement keeps the anchor step id.");
      }
      if (change.operation === "insert-before") {
        if (referenceStepIds.has(change.step.id) || insertedIds.includes(change.step.id)) {
          report("duplicate-step-id", `${changePath}.step.id`, `Inserted step id "${change.step.id}" is taken.`);
        }
        insertedIds.push(change.step.id);
      }
      const text = normalizeName(change.step.text);
      for (const name of sourceNames) {
        if (text.includes(name)) {
          report("instruction-mentions-source", `${changePath}.step.text`, `Text still mentions "${name}".`);
        }
      }
    });
  });

  // ---- Cases ----------------------------------------------------------------------------------------------------

  if (!requireFields(cases, "cases", { schemaVersion: "number", catalogVersion: "number", cases: "array" })) {
    return diagnostics;
  }
  if (cases.schemaVersion !== catalog.schemaVersion) {
    report("version-mismatch", "cases.schemaVersion", "Cases schemaVersion must match the catalog.");
  }
  if (cases.catalogVersion !== catalog.catalogVersion) {
    report("version-mismatch", "cases.catalogVersion", "Cases must target the current catalogVersion.");
  }

  const caseIds = new Set();
  const caseKinds = new Set();
  const mismatchKinds = new Set();

  /** Rules that would be candidates for this case's excluded sources in any context. */
  const candidatesFor = (exclusionIds) =>
    [...substitutions.values()].filter((rule) => exclusionIds.includes(rule.sourceProductId)).map((rule) => rule.id);

  cases.cases.forEach((example, index) => {
    const path = `cases.cases[${index}]`;
    if (
      !requireFields(example, path, {
        id: "string",
        caseKind: "string",
        catalogVersion: "number",
        recipe: "object",
        exclusionIds: "array",
        expected: "object",
      })
    ) {
      return;
    }
    requireSlug(example.id, `${path}.id`);
    if (caseIds.has(example.id)) report("duplicate-id", `${path}.id`, `Duplicate case id "${example.id}".`);
    caseIds.add(example.id);
    caseKinds.add(example.caseKind);
    if (!REQUIRED_CASE_KINDS.includes(example.caseKind)) {
      report("unknown-case-kind", `${path}.caseKind`, `Unknown caseKind "${example.caseKind}".`);
    }
    if (example.catalogVersion !== catalog.catalogVersion) {
      report("version-mismatch", `${path}.catalogVersion`, "Case must target the current catalogVersion.");
    }
    for (const id of duplicates(example.exclusionIds)) {
      report("duplicate-reference", `${path}.exclusionIds`, `Exclusion "${id}" repeats.`);
    }
    example.exclusionIds.forEach((id, exclusionIndex) => {
      if (!SELECTABLE_EXCLUSION_IDS.includes(id) || !catalog.selectableExclusionIds.includes(id)) {
        report("unknown-exclusion", `${path}.exclusionIds[${exclusionIndex}]`, `"${id}" is not selectable.`);
      }
    });

    // Template relation of the input recipe.
    const mismatch = example.templateMismatch;
    const isMismatchKind = example.caseKind === "template-mismatch";
    if (mismatch !== undefined || isMismatchKind) {
      if (!isMismatchKind) {
        report("unexpected-template-mismatch", `${path}.templateMismatch`, "Only template-mismatch cases may set it.");
      } else if (!TEMPLATE_MISMATCH_KINDS.includes(mismatch)) {
        report(
          "invalid-template-mismatch",
          `${path}.templateMismatch`,
          `templateMismatch must be one of: ${TEMPLATE_MISMATCH_KINDS.join(", ")}.`,
        );
      } else {
        mismatchKinds.add(mismatch);
      }
    }
    const recipe = example.recipe;
    const recipeOk = checkRecipe(recipe, `${path}.recipe`, {
      allowUnknown: true,
      allowDuplicateStepIds: isMismatchKind && mismatch === "duplicate-step-id",
    });

    if (recipeOk && referenceOk) {
      const steps = recipe.steps.filter(isObject);
      const ids = steps.map((step) => step.id);
      const sameTemplate =
        recipe.templateId === reference.templateId && recipe.templateVersion === reference.templateVersion;
      const structureMatches =
        steps.length === referenceSteps.length &&
        steps.every((step, stepIndex) => sameStep(step, referenceSteps[stepIndex]));
      const anchors = catalog.substitutions
        .filter((rule) => isObject(rule) && Array.isArray(rule.instructionChanges))
        .flatMap((rule) => rule.instructionChanges.filter(isObject).map((change) => change.stepId));
      const actual = {
        "template-id": recipe.templateId !== reference.templateId && structureMatches,
        "template-version":
          recipe.templateId === reference.templateId &&
          recipe.templateVersion !== reference.templateVersion &&
          structureMatches,
        "missing-anchor": sameTemplate && anchors.some((anchor) => !ids.includes(anchor)),
        "duplicate-step-id": sameTemplate && duplicates(ids).length > 0,
        "changed-step-text":
          sameTemplate &&
          !structureMatches &&
          ids.length === referenceSteps.length &&
          ids.every((id, stepIndex) => id === referenceSteps[stepIndex].id) &&
          steps.some((step, stepIndex) => step.text !== referenceSteps[stepIndex].text),
      };
      if (isMismatchKind && TEMPLATE_MISMATCH_KINDS.includes(mismatch)) {
        if (!actual[mismatch]) {
          report("template-mismatch-not-present", `${path}.recipe`, `Recipe does not exhibit "${mismatch}".`);
        }
        if (!example.exclusionIds.includes("cow-milk")) {
          report("template-mismatch-without-conflict", `${path}.exclusionIds`, "Exclude cow-milk to exercise rules.");
        }
      } else if (sameTemplate && !structureMatches) {
        report(
          "template-structure-mismatch",
          `${path}.recipe.steps`,
          `Recipe claims ${reference.templateId}@${reference.templateVersion} but its steps differ; declare templateMismatch.`,
        );
      }
    }

    checkExpected(example, path, recipeOk);
  });

  function checkExpected(example, path, recipeOk) {
    const expected = example.expected;
    const expectedPath = `${path}.expected`;
    if (
      !requireFields(expected, expectedPath, {
        outcome: "string",
        reason: "string",
        conflicts: "array",
        substitutionIds: "array",
        skippedSubstitutions: "array",
      })
    ) {
      return;
    }
    if (!OUTCOMES.includes(expected.outcome)) {
      report("invalid-outcome", `${expectedPath}.outcome`, `Outcome must be one of: ${OUTCOMES.join(", ")}.`);
      return;
    }
    if (!REASONS_BY_OUTCOME[expected.outcome].includes(expected.reason)) {
      report(
        "invalid-reason",
        `${expectedPath}.reason`,
        `Reason for ${expected.outcome} must be one of: ${REASONS_BY_OUTCOME[expected.outcome].join(", ")}.`,
      );
    }

    const ingredients = recipeOk ? example.recipe.ingredients.filter(isObject) : [];
    const ingredient = (id) => ingredients.find((candidate) => candidate.id === id);
    const hasUnknown = ingredients.some((candidate) => Object.hasOwn(candidate, "name"));

    expected.conflicts.forEach((conflict, index) => {
      const conflictPath = `${expectedPath}.conflicts[${index}]`;
      if (!requireFields(conflict, conflictPath, { ingredientId: "string", exclusionId: "string", path: "array" })) {
        return;
      }
      if (!example.exclusionIds.includes(conflict.exclusionId)) {
        report("unknown-exclusion", `${conflictPath}.exclusionId`, "Conflict exclusion is not selected in this case.");
      }
      const productId = ingredient(conflict.ingredientId)?.productId;
      if (productId === undefined) {
        report("unknown-ingredient-reference", `${conflictPath}.ingredientId`, "Conflict needs a known ingredient.");
      } else if (!isContainsPath(conflict.path, productId, conflict.exclusionId)) {
        report("invalid-conflict-path", `${conflictPath}.path`, "Path must follow contains from product to exclusion.");
      }
    });
    if (recipeOk) {
      // Expected conflicts must list every graph conflict of the input recipe — not more, not fewer.
      for (const candidate of ingredients) {
        if (!products.has(candidate.productId)) continue;
        for (const exclusionId of example.exclusionIds) {
          const conflicting = reachable(candidate.productId).has(exclusionId);
          const listed = expected.conflicts.some(
            (conflict) =>
              isObject(conflict) && conflict.ingredientId === candidate.id && conflict.exclusionId === exclusionId,
          );
          if (conflicting && !listed) {
            report("missing-conflict", `${expectedPath}.conflicts`, `${candidate.id} conflicts with ${exclusionId}.`);
          } else if (!conflicting && listed) {
            report("invalid-conflict-path", `${expectedPath}.conflicts`, `${candidate.id} has no ${exclusionId} path.`);
          }
        }
      }
    }

    const overlay = example.testOnlyOverlay;
    const overlayField = OVERLAY_FIELD_BY_KIND[example.caseKind];
    if (overlay !== undefined || overlayField !== undefined) {
      if (overlayField === undefined) {
        report("unexpected-overlay", `${path}.testOnlyOverlay`, "Only incomplete-rule cases may use an overlay.");
      } else if (requireFields(overlay, `${path}.testOnlyOverlay`, { substitutions: "array" })) {
        const covered = [];
        overlay.substitutions.forEach((entry, index) => {
          const entryPath = `${path}.testOnlyOverlay.substitutions[${index}]`;
          if (!requireFields(entry, entryPath, { substitutionId: "string", removeFields: "array" })) return;
          covered.push(entry.substitutionId);
          if (!substitutions.has(entry.substitutionId)) {
            report("unknown-reference", `${entryPath}.substitutionId`, `"${entry.substitutionId}" does not exist.`);
          }
          if (entry.removeFields.length === 0) {
            report("empty-field", `${entryPath}.removeFields`, "Overlay must remove a required field.");
          }
          entry.removeFields.forEach((field, fieldIndex) => {
            if (!OVERLAY_REMOVABLE_FIELDS.includes(field)) {
              report("invalid-overlay-field", `${entryPath}.removeFields[${fieldIndex}]`, `Cannot remove "${field}".`);
            }
          });
          if (!entry.removeFields.includes(overlayField)) {
            report(
              "invalid-overlay-field",
              `${entryPath}.removeFields`,
              `${example.caseKind} must remove ${overlayField}.`,
            );
          }
        });
        for (const id of candidatesFor(example.exclusionIds)) {
          if (!covered.includes(id)) {
            report("overlay-incomplete", `${path}.testOnlyOverlay`, `Overlay must cover candidate "${id}".`);
          }
        }
        if (expected.outcome !== "rejected") {
          report("overlay-without-rejection", `${expectedPath}.outcome`, "Overlay cases must expect rejection.");
        }
      }
    }

    const candidates = candidatesFor(example.exclusionIds);
    expected.substitutionIds.forEach((id, index) => {
      const rule = substitutions.get(id);
      if (rule === undefined)
        report("unknown-reference", `${expectedPath}.substitutionIds[${index}]`, `"${id}" is unknown.`);
    });
    const skipped = [];
    expected.skippedSubstitutions.forEach((entry, index) => {
      const entryPath = `${expectedPath}.skippedSubstitutions[${index}]`;
      if (!requireFields(entry, entryPath, { substitutionId: "string", reason: "string", path: "array" })) return;
      skipped.push(entry);
      const rule = substitutions.get(entry.substitutionId);
      if (rule === undefined) {
        report("unknown-reference", `${entryPath}.substitutionId`, `"${entry.substitutionId}" is unknown.`);
      }
      if (!SKIP_REASONS.includes(entry.reason)) {
        report("invalid-reason", `${entryPath}.reason`, `Skip reason must be one of: ${SKIP_REASONS.join(", ")}.`);
      } else if (entry.reason === "target-conflict") {
        const valid =
          rule !== undefined &&
          example.exclusionIds.some((exclusionId) => isContainsPath(entry.path, rule.targetProductId, exclusionId));
        if (!valid) {
          report(
            "invalid-conflict-path",
            `${entryPath}.path`,
            "Path must lead from the target to a selected exclusion.",
          );
        }
      } else if (entry.path.length > 0) {
        report("invalid-conflict-path", `${entryPath}.path`, "Only target-conflict skips carry a path.");
      }
      if (expected.substitutionIds.includes(entry.substitutionId)) {
        report("skipped-and-applied", entryPath, "A rule cannot be both skipped and applied.");
      }
    });
    const skipReason = ALL_CANDIDATES_SKIPPED[example.caseKind];
    if (skipReason !== undefined) {
      for (const id of candidates) {
        if (!skipped.some((entry) => entry.substitutionId === id && entry.reason === skipReason)) {
          report("missing-skip", `${expectedPath}.skippedSubstitutions`, `"${id}" must be skipped as ${skipReason}.`);
        }
      }
      if (candidates.length === 0) {
        report("missing-skip", `${path}.exclusionIds`, `${example.caseKind} must exclude a source with candidates.`);
      }
    }

    if (expected.outcome === "rejected") {
      if (expected.substitutionIds.length > 0) {
        report("partial-substitution", `${expectedPath}.substitutionIds`, "A rejection applies no substitution.");
      }
      if (expected.recipe !== undefined) {
        report("unexpected-recipe", `${expectedPath}.recipe`, "A rejection has no resulting recipe.");
      }
      if (expected.reason === "unknown-ingredient" && recipeOk && !hasUnknown) {
        report("invalid-reason", `${expectedPath}.reason`, "unknown-ingredient requires an unresolved name.");
      }
      if (expected.reason === "unresolved-conflict" && expected.conflicts.length === 0) {
        report("invalid-reason", `${expectedPath}.reason`, "unresolved-conflict requires a listed conflict.");
      }
      if (example.caseKind === "unknown-ingredient" || example.caseKind === "ambiguous-name") {
        if (expected.reason !== "unknown-ingredient") {
          report("invalid-reason", `${expectedPath}.reason`, `${example.caseKind} must be rejected as unknown.`);
        }
      }
      return;
    }

    if (recipeOk && hasUnknown) {
      report("invalid-outcome", `${expectedPath}.outcome`, "A recipe with an unknown ingredient must be rejected.");
    }
    if (expected.recipe === undefined) {
      report("missing-field", `${expectedPath}.recipe`, `${expected.outcome} requires the complete resulting recipe.`);
      return;
    }
    if (!checkRecipe(expected.recipe, `${expectedPath}.recipe`, { allowUnknown: false }) || !recipeOk) return;

    if (expected.outcome === "accepted") {
      if (expected.conflicts.length > 0 || expected.substitutionIds.length > 0) {
        report("invalid-outcome", expectedPath, "Accepted recipes have no conflicts and no substitutions.");
      }
      if (!deepEqual(expected.recipe, example.recipe)) {
        report("recipe-changed", `${expectedPath}.recipe`, "An accepted recipe keeps all ingredients and steps.");
      }
      return;
    }

    // substituted
    if (expected.conflicts.length === 0 || expected.substitutionIds.length === 0) {
      report("invalid-outcome", expectedPath, "A substitution resolves a listed conflict with a listed rule.");
    }
    const resultIngredients = expected.recipe.ingredients.filter(isObject);
    const resultIds = resultIngredients.map((candidate) => candidate.id);
    if (JSON.stringify(resultIds) !== JSON.stringify(ingredients.map((candidate) => candidate.id))) {
      report("ingredient-ids-changed", `${expectedPath}.recipe.ingredients`, "Ingredient ids and order are preserved.");
    }
    for (const result of resultIngredients) {
      const input = ingredient(result.id);
      if (input !== undefined && input.productId !== result.productId) {
        const applied = expected.substitutionIds.some((id) => {
          const rule = substitutions.get(id);
          return rule?.sourceProductId === input.productId && rule.targetProductId === result.productId;
        });
        if (!applied) {
          report(
            "unexplained-product-change",
            `${expectedPath}.recipe.ingredients`,
            `${result.id} changed without a rule.`,
          );
        }
      }
      // Full revalidation: no ingredient of the resulting recipe may still reach a selected exclusion.
      for (const exclusionId of example.exclusionIds) {
        if (products.has(result.productId) && reachable(result.productId).has(exclusionId)) {
          report(
            "result-conflict",
            `${expectedPath}.recipe.ingredients`,
            `${result.id} still conflicts with ${exclusionId}.`,
          );
        }
      }
    }
  }

  for (const kind of REQUIRED_CASE_KINDS) {
    if (!caseKinds.has(kind)) report("missing-case-kind", "cases.cases", `No case of required kind "${kind}".`);
  }
  for (const kind of TEMPLATE_MISMATCH_KINDS) {
    if (!mismatchKinds.has(kind)) {
      report("missing-template-mismatch", "cases.cases", `No template-mismatch case of variant "${kind}".`);
    }
  }

  return diagnostics;
}
