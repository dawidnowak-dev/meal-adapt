// Integrity check for the versioned meal catalog and its acceptance cases.
// Reads both v1 files relative to this script (not the working directory); no network, no secrets.
// Usage: node scripts/check-meal-catalog.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import { checkCatalog } from "./lib/meal-catalog-check.mjs";

const files = {
  catalog: fileURLToPath(new URL("../src/data/meal-catalog.v1.json", import.meta.url)),
  cases: fileURLToPath(new URL("../src/data/meal-catalog-cases.v1.json", import.meta.url)),
};

async function load(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    console.error(`FAIL  cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

const catalog = await load(files.catalog);
const cases = await load(files.cases);
const diagnostics = checkCatalog(catalog, cases);

for (const { code, path, message } of diagnostics) console.error(`FAIL  ${code}  ${path}  ${message}`);

const count = (value) => (Array.isArray(value) ? value.length : 0);
console.log(
  `Catalog v${String(catalog?.catalogVersion)}: ${count(catalog?.products)} products, ` +
    `${count(catalog?.substitutions)} substitution rules, ${count(cases?.cases)} cases.`,
);
console.log(diagnostics.length > 0 ? `${diagnostics.length} diagnostic(s).` : "Catalog check passed.");
process.exit(diagnostics.length > 0 ? 1 : 0);
