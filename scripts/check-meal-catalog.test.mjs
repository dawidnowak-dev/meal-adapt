/** Tests for the meal catalog integrity check, its CLI and the JSON-to-TypeScript contract binding. */
import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import ts from "typescript";
import { checkCatalog } from "./lib/meal-catalog-check.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const paths = {
  catalog: join(root, "src/data/meal-catalog.v1.json"),
  cases: join(root, "src/data/meal-catalog-cases.v1.json"),
  contract: join(root, "src/lib/catalog/data-contract.ts"),
  cli: join(root, "scripts/check-meal-catalog.mjs"),
  lib: join(root, "scripts/lib/meal-catalog-check.mjs"),
};
const sourceText = { catalog: readFileSync(paths.catalog, "utf8"), cases: readFileSync(paths.cases, "utf8") };

const PEA_RULE = "cow-milk-to-pea-drink-unsweetened-crepes-v1";
const OAT_RULE = "cow-milk-to-oat-drink-unsweetened-crepes-v1";

/** Fresh, independent copies of the real data for every test. */
function data() {
  return { catalog: JSON.parse(sourceText.catalog), cases: JSON.parse(sourceText.cases) };
}
const product = (catalog, id) => catalog.products.find((candidate) => candidate.id === id);
const rule = (catalog, id) => catalog.substitutions.find((candidate) => candidate.id === id);
const example = (cases, id) => cases.cases.find((candidate) => candidate.id === id);
const codes = (diagnostics) => diagnostics.map((diagnostic) => diagnostic.code);

function expectDiagnostic(catalog, cases, code, pathFragment) {
  const diagnostics = checkCatalog(catalog, cases);
  const match = diagnostics.find(
    (diagnostic) => diagnostic.code === code && (pathFragment === undefined || diagnostic.path.includes(pathFragment)),
  );
  assert.ok(match, `expected ${code}${pathFragment ? ` at ${pathFragment}` : ""}, got ${JSON.stringify(diagnostics)}`);
  for (const diagnostic of diagnostics) {
    assert.equal(typeof diagnostic.path, "string");
    assert.ok(diagnostic.message.length > 0);
  }
  return diagnostics;
}

function deepFreeze(value) {
  if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

describe("checkCatalog on the real data", () => {
  test("the repository catalog and cases produce no diagnostics", () => {
    const { catalog, cases } = data();
    assert.deepEqual(checkCatalog(catalog, cases), []);
  });

  test("does not mutate its arguments", () => {
    const { catalog, cases } = data();
    deepFreeze(catalog);
    deepFreeze(cases);
    assert.deepEqual(checkCatalog(catalog, cases), []);
    assert.deepEqual(catalog, JSON.parse(sourceText.catalog));
    assert.deepEqual(cases, JSON.parse(sourceText.cases));
  });

  test("a valid multi-level contains chain is not a cycle", () => {
    const { catalog, cases } = data();
    assert.deepEqual(product(catalog, "pea-drink-unsweetened").contains, ["water", "pea-protein", "rapeseed-oil"]);
    assert.deepEqual(product(catalog, "pea-protein").contains, ["pea"]);
    // Deeper chain with a shared sub-graph (diamond): mix -> drink -> protein -> pea and mix -> flour -> wheat.
    const mix = JSON.parse(JSON.stringify(product(catalog, "wheat-flour")));
    Object.assign(mix, {
      id: "crepe-mix",
      name: "mieszanka naleśnikowa",
      aliases: [],
      contains: ["wheat-flour", "pea-drink-unsweetened", "pea-protein"],
    });
    catalog.products.push(mix);
    assert.deepEqual(checkCatalog(catalog, cases), []);
  });
});

describe("checkCatalog catalog diagnostics", () => {
  test("wrong selectable exclusion set", () => {
    const { catalog, cases } = data();
    catalog.selectableExclusionIds.push("oat");
    expectDiagnostic(catalog, cases, "selectable-exclusions", "catalog.selectableExclusionIds");
  });

  test("unsupported schema version", () => {
    const { catalog, cases } = data();
    catalog.schemaVersion = 2;
    expectDiagnostic(catalog, cases, "unsupported-version", "catalog.schemaVersion");
  });

  test("missing contains reference", () => {
    const { catalog, cases } = data();
    product(catalog, "wheat-flour").contains.push("rye");
    expectDiagnostic(catalog, cases, "unknown-reference", "catalog.products[4].contains[1]");
  });

  test("cycle in contains", () => {
    const { catalog, cases } = data();
    product(catalog, "pea").contains.push("pea-drink-unsweetened");
    const diagnostics = expectDiagnostic(catalog, cases, "contains-cycle");
    assert.equal(codes(diagnostics).filter((code) => code === "contains-cycle").length, 1);
  });

  test("alias conflict after normalization", () => {
    const { catalog, cases } = data();
    product(catalog, "oat-drink-unsweetened").aliases.push("  Mleko \t KROWIE ");
    expectDiagnostic(catalog, cases, "ambiguous-name", "catalog.products[11].aliases[1]");
  });

  test("duplicate product id", () => {
    const { catalog, cases } = data();
    product(catalog, "oat").id = "water";
    expectDiagnostic(catalog, cases, "duplicate-id", "catalog.products[8].id");
  });

  test("empty instruction changes", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).instructionChanges = [];
    expectDiagnostic(catalog, cases, "empty-instructions", "catalog.substitutions[0].instructionChanges");
  });

  test("incomplete rule without quantity", () => {
    const { catalog, cases } = data();
    delete rule(catalog, OAT_RULE).quantity;
    expectDiagnostic(catalog, cases, "missing-field", "catalog.substitutions[1].quantity");
  });

  test("incomplete instruction step", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).instructionChanges[1].step.text = "  ";
    expectDiagnostic(catalog, cases, "empty-field", "catalog.substitutions[0].instructionChanges[1].step.text");
  });

  test("non-positive quantities", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).quantity.fromAmount = 0;
    rule(catalog, OAT_RULE).quantity.toAmount = -1;
    expectDiagnostic(catalog, cases, "non-positive-amount", "catalog.substitutions[0].quantity.fromAmount");
    expectDiagnostic(catalog, cases, "non-positive-amount", "catalog.substitutions[1].quantity.toAmount");
  });

  test("unsupported unit and ratio", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).quantity.fromUnit = "g";
    rule(catalog, OAT_RULE).quantity.toAmount = 2;
    expectDiagnostic(catalog, cases, "unsupported-unit", "catalog.substitutions[0].quantity");
    expectDiagnostic(catalog, cases, "unsupported-ratio", "catalog.substitutions[1].quantity");
  });

  test("duplicate priority for the same source and context", () => {
    const { catalog, cases } = data();
    rule(catalog, OAT_RULE).priority = 1;
    expectDiagnostic(catalog, cases, "duplicate-priority", "catalog.substitutions[1].priority");
  });

  test("unknown product in the reference recipe", () => {
    const { catalog, cases } = data();
    catalog.referenceRecipe.ingredients[3].productId = "butter";
    expectDiagnostic(catalog, cases, "unknown-product", "catalog.referenceRecipe.ingredients[3].productId");
  });

  test("unknown product in a case recipe", () => {
    const { catalog, cases } = data();
    example(cases, "wheat-flour-indirect-conflict-rejected").recipe.ingredients[0].productId = "spelt-flour";
    expectDiagnostic(catalog, cases, "unknown-product", ".recipe.ingredients[0].productId");
  });

  test("instruction change anchored to a missing step id", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).instructionChanges[0].stepId = "mix-milk";
    expectDiagnostic(catalog, cases, "unknown-step", "catalog.substitutions[0].instructionChanges[0].stepId");
  });

  test("step referencing an ingredient outside the recipe", () => {
    const { catalog, cases } = data();
    catalog.referenceRecipe.steps[1].ingredientIds.push("sugar");
    expectDiagnostic(
      catalog,
      cases,
      "unknown-ingredient-reference",
      "catalog.referenceRecipe.steps[1].ingredientIds[1]",
    );
  });

  test("appliesTo bound to another template id or version", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).appliesTo.templateId = "crepes-custom";
    rule(catalog, OAT_RULE).appliesTo.templateVersion = 2;
    expectDiagnostic(catalog, cases, "applies-to-mismatch", "catalog.substitutions[0].appliesTo");
    expectDiagnostic(catalog, cases, "applies-to-mismatch", "catalog.substitutions[1].appliesTo");
  });

  test("rule outside the crepes context", () => {
    const { catalog, cases } = data();
    rule(catalog, OAT_RULE).context = "soups";
    expectDiagnostic(catalog, cases, "unsupported-context", "catalog.substitutions[1].context");
  });

  test("duplicate step ids in the reference template", () => {
    const { catalog, cases } = data();
    catalog.referenceRecipe.steps[1].id = "mix-liquids";
    expectDiagnostic(catalog, cases, "duplicate-step-id", "catalog.referenceRecipe.steps");
  });

  test("placeholder without a parameter", () => {
    const { catalog, cases } = data();
    catalog.referenceRecipe.steps[2].text += " Dodaj {sugarAmount}.";
    expectDiagnostic(catalog, cases, "undefined-placeholder", "catalog.referenceRecipe.steps[2].text");
  });

  test("instruction change still mentioning the source product", () => {
    const { catalog, cases } = data();
    rule(catalog, PEA_RULE).instructionChanges[1].step.text += " Nie używaj: mleko krowie.";
    expectDiagnostic(catalog, cases, "instruction-mentions-source", "catalog.substitutions[0].instructionChanges[1]");
  });
});

describe("checkCatalog case diagnostics", () => {
  test("missing required case kind", () => {
    const { catalog, cases } = data();
    cases.cases = cases.cases.filter((candidate) => candidate.caseKind !== "substitution-fallback");
    const diagnostics = expectDiagnostic(catalog, cases, "missing-case-kind", "cases.cases");
    assert.ok(diagnostics.some((diagnostic) => diagnostic.message.includes("substitution-fallback")));
  });

  test("missing template-mismatch rejection variant", () => {
    const { catalog, cases } = data();
    cases.cases = cases.cases.filter((candidate) => candidate.templateMismatch !== "duplicate-step-id");
    const diagnostics = expectDiagnostic(catalog, cases, "missing-template-mismatch", "cases.cases");
    assert.ok(diagnostics.some((diagnostic) => diagnostic.message.includes("duplicate-step-id")));
  });

  test("declared template mismatch that the recipe does not exhibit", () => {
    const { catalog, cases } = data();
    const mismatch = example(cases, "template-mismatch-changed-step-text");
    mismatch.recipe = JSON.parse(JSON.stringify(catalog.referenceRecipe));
    expectDiagnostic(catalog, cases, "template-mismatch-not-present", "cases.cases[16].recipe");
  });

  test("template mismatch must expect every candidate to be skipped", () => {
    const { catalog, cases } = data();
    example(cases, "template-mismatch-template-version").expected.skippedSubstitutions.pop();
    expectDiagnostic(catalog, cases, "missing-skip", "cases.cases[13].expected.skippedSubstitutions");
  });

  test("undeclared step drift on the reference template", () => {
    const { catalog, cases } = data();
    example(cases, "milk-in-grams-not-converted").recipe.steps[3].text =
      "Rozgrzej patelnię. Odmierz {oilAmount} {oilUnit} składnika: {oilName}.";
    expectDiagnostic(catalog, cases, "template-structure-mismatch", "cases.cases[11].recipe.steps");
  });

  test("overlay that leaves a valid fallback candidate", () => {
    const { catalog, cases } = data();
    example(cases, "rules-without-quantity-rejected").testOnlyOverlay.substitutions.pop();
    expectDiagnostic(catalog, cases, "overlay-incomplete", "cases.cases[8].testOnlyOverlay");
  });

  test("overlay without an expected rejection", () => {
    const { catalog, cases } = data();
    const overlayCase = example(cases, "rules-without-instructions-rejected");
    overlayCase.expected.outcome = "substituted";
    expectDiagnostic(catalog, cases, "overlay-without-rejection", "cases.cases[9].expected.outcome");
  });

  test("overlay may only remove required rule fields", () => {
    const { catalog, cases } = data();
    example(cases, "rules-without-quantity-rejected").testOnlyOverlay.substitutions[0].removeFields.push("id");
    expectDiagnostic(catalog, cases, "invalid-overlay-field", "cases.cases[8].testOnlyOverlay.substitutions[0]");
  });

  test("unknown ingredient name that the catalog does recognize", () => {
    const { catalog, cases } = data();
    example(cases, "ambiguous-milk-name-rejected").recipe.ingredients[1].name = "Mleko  Krowie";
    expectDiagnostic(catalog, cases, "unknown-name-is-known", "cases.cases[7].recipe.ingredients[1].name");
  });

  test("unknown ingredient cannot be accepted", () => {
    const { catalog, cases } = data();
    const unknown = example(cases, "unknown-ingredient-rejected");
    unknown.expected = { ...unknown.expected, outcome: "accepted", reason: "no-conflict", recipe: unknown.recipe };
    expectDiagnostic(catalog, cases, "invalid-outcome", "cases.cases[6].expected.outcome");
  });

  test("conflict path that skips a contains edge", () => {
    const { catalog, cases } = data();
    example(cases, "cow-milk-and-pea-fallback-to-oat-drink").expected.skippedSubstitutions[0].path = [
      "pea-drink-unsweetened",
      "pea",
    ];
    expectDiagnostic(catalog, cases, "invalid-conflict-path", "cases.cases[2].expected.skippedSubstitutions[0].path");
  });

  test("expected conflicts must list every input conflict", () => {
    const { catalog, cases } = data();
    example(cases, "milk-and-wheat-full-revalidation-rejected").expected.conflicts.pop();
    expectDiagnostic(catalog, cases, "missing-conflict", "cases.cases[17].expected.conflicts");
  });

  test("substituted result that still conflicts", () => {
    const { catalog, cases } = data();
    example(cases, "cow-milk-and-pea-fallback-to-oat-drink").exclusionIds.push("wheat");
    expectDiagnostic(catalog, cases, "result-conflict", "cases.cases[2].expected.recipe.ingredients");
  });

  test("rejection must not carry a partial substitution", () => {
    const { catalog, cases } = data();
    example(cases, "milk-and-wheat-full-revalidation-rejected").expected.substitutionIds.push(PEA_RULE);
    expectDiagnostic(catalog, cases, "partial-substitution", "cases.cases[17].expected.substitutionIds");
  });

  test("case exclusion outside the selectable set", () => {
    const { catalog, cases } = data();
    example(cases, "crepes-no-exclusions-unchanged").exclusionIds.push("oat");
    expectDiagnostic(catalog, cases, "unknown-exclusion", "cases.cases[0].exclusionIds[0]");
  });

  test("case bound to another catalog version", () => {
    const { catalog, cases } = data();
    cases.cases[0].catalogVersion = 2;
    expectDiagnostic(catalog, cases, "version-mismatch", "cases.cases[0].catalogVersion");
  });

  test("case missing its expected result shape", () => {
    const { catalog, cases } = data();
    delete cases.cases[1].expected.skippedSubstitutions;
    delete cases.cases[1].expected.recipe;
    expectDiagnostic(catalog, cases, "missing-field", "cases.cases[1].expected.skippedSubstitutions");
  });
});

describe("check-meal-catalog CLI", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "meal-catalog-cli-"));
  after(() => rmSync(sandbox, { recursive: true, force: true }));
  let counter = 0;

  /** Mirrors the repository layout so the unmodified CLI resolves data relative to its own location. */
  function stage(catalogText, casesText) {
    const dir = join(sandbox, String(counter++));
    mkdirSync(join(dir, "scripts/lib"), { recursive: true });
    mkdirSync(join(dir, "src/data"), { recursive: true });
    copyFileSync(paths.cli, join(dir, "scripts/check-meal-catalog.mjs"));
    copyFileSync(paths.lib, join(dir, "scripts/lib/meal-catalog-check.mjs"));
    writeFileSync(join(dir, "src/data/meal-catalog.v1.json"), catalogText);
    writeFileSync(join(dir, "src/data/meal-catalog-cases.v1.json"), casesText);
    return spawnSync(process.execPath, [join(dir, "scripts/check-meal-catalog.mjs")], {
      cwd: tmpdir(),
      encoding: "utf8",
    });
  }

  const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
  const before = { catalog: sha(paths.catalog), cases: sha(paths.cases) };

  test("real data copy exits 0 and prints counts", () => {
    const result = stage(sourceText.catalog, sourceText.cases);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /12 products, 2 substitution rules, 18 cases/);
  });

  test("invalid catalog exits 1 with diagnostics", () => {
    const { catalog } = data();
    product(catalog, "pea").contains.push("pea-drink-unsweetened");
    const result = stage(JSON.stringify(catalog), sourceText.cases);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /contains-cycle/);
  });

  test("unparsable cases exit 1", () => {
    const result = stage(sourceText.catalog, "{ not json");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot read/);
  });

  test("source JSON files are untouched", () => {
    assert.deepEqual({ catalog: sha(paths.catalog), cases: sha(paths.cases) }, before);
  });
});

describe("data-contract.ts type binding", () => {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    join(root, "tsconfig.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  const options = { ...parsed.options, noEmit: true, types: [] };

  /** Compiles the real data-contract.ts while serving the given JSON text from memory for the two data paths. */
  function compile(overrides) {
    const served = new Map(Object.entries(overrides).map(([key, text]) => [ts.sys.resolvePath(paths[key]), text]));
    const host = ts.createCompilerHost(options);
    const readFile = host.readFile.bind(host);
    const getSourceFile = host.getSourceFile.bind(host);
    host.readFile = (file) => served.get(ts.sys.resolvePath(file)) ?? readFile(file);
    host.getSourceFile = (file, language, onError, shouldCreate) => {
      const text = served.get(ts.sys.resolvePath(file));
      return text === undefined
        ? getSourceFile(file, language, onError, shouldCreate)
        : ts.createSourceFile(file, text, language, true, ts.ScriptKind.JSON);
    };
    const program = ts.createProgram([paths.contract], options, host);
    for (const key of ["catalog", "cases"]) {
      assert.ok(program.getSourceFile(paths[key]), `${key} JSON must be part of the program`);
    }
    return ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
      code: diagnostic.code,
      file: diagnostic.file?.fileName,
      text: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    }));
  }

  function withoutField(text, remove) {
    const value = JSON.parse(text);
    remove(value);
    return JSON.stringify(value, null, 2);
  }

  function assertStructuralError(diagnostics, field) {
    assert.ok(diagnostics.length > 0, "expected a type diagnostic");
    for (const diagnostic of diagnostics) {
      assert.ok(![2307, 2732, 6053].includes(diagnostic.code), `import failed instead: ${diagnostic.text}`);
    }
    assert.ok(
      diagnostics.some((diagnostic) => diagnostic.file === paths.contract && diagnostic.text.includes(field)),
      `expected a contract diagnostic naming ${field}: ${JSON.stringify(diagnostics)}`,
    );
  }

  test("both real JSON files satisfy the public types", () => {
    assert.deepEqual(compile({ catalog: sourceText.catalog, cases: sourceText.cases }), []);
  });

  test("catalog without a required field fails the contract", () => {
    const catalog = withoutField(sourceText.catalog, (value) => delete value.catalogVersion);
    assertStructuralError(compile({ catalog, cases: sourceText.cases }), "catalogVersion");
  });

  test("case without a required field fails the contract", () => {
    const cases = withoutField(sourceText.cases, (value) => delete value.cases[0].caseKind);
    assertStructuralError(compile({ catalog: sourceText.catalog, cases }), "caseKind");
  });

  test("source JSON files are untouched by the compiler tests", () => {
    assert.equal(readFileSync(paths.catalog, "utf8"), sourceText.catalog);
    assert.equal(readFileSync(paths.cases, "utf8"), sourceText.cases);
  });
});
