<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Sprawdzony katalog pierwszego posiłku

- **Plan**: context/changes/verified-first-meal-catalog/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-19
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 4 warnings, 5 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | WARNING |
| Safety & Quality    | WARNING |
| Architecture        | PASS    |
| Pattern Consistency | WARNING |
| Success Criteria    | PASS    |

Success criteria re-run on Node 22.23.3 (2026-10-19): JSON parse, `node scripts/check-meal-catalog.mjs` (12 products, 2 rules, 18 cases), `node --test` (49/49), `npm run check:catalog`, `npm run test:catalog`, `astro sync`, `npm run lint`, `astro check` (0 errors), `npm run build` — all exit 0. Hashes in catalog-review.md match current JSON. Manual 3.4/3.5 approved by the owner in-session and recorded in catalog-review.md.

Dismissed during review: CI ordering of `test:catalog` before `astro sync` — the TS compile test roots the program at `data-contract.ts` only (`ts.createProgram([paths.contract], …)`), so a missing `.astro/types.d.ts` cannot affect it.

## Findings

### F1 — Candidate order and fallback are not enforced in expected results

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:806-851, 893-927
- **Detail**: Priorities are checked for uniqueness, but a `substituted` case may apply a lower-ranked rule without listing the higher-ranked candidate as skipped. Probes on in-memory copies: US-01 switched to the oat rule (priority 2) with no pea skip → `[]`; `skippedSubstitutions` emptied in the fallback case → `[]`. The plan treats the pea → oat order as load-bearing. Related: the milk+wheat revalidation case doesn't record that the milk rule was available.
- **Fix A ⭐ Recommended**: In the checker, require every same-source/context candidate with lower priority than the applied rule to appear in `skippedSubstitutions`, and require at least one skip for `substitution-fallback`.
  - Strength: Structural completeness check on recorded expectations, the same kind of check already done for template mismatches (`template-mismatch-not-present`); it doesn't execute rules.
  - Tradeoff: ~20 lines plus 2 negative tests; the checker edges closer to "selection logic".
  - Confidence: HIGH — both probes reproduce the gap deterministically.
  - Blind spot: No JSON change, so the recorded approval hashes stay valid, but this hasn't been confirmed against a future S-02 contract.
- **Fix B**: Leave it to S-02 engine tests, which will compare execution against these cases.
  - Strength: Respects the plan boundary "kontrola danych nie wykonuje doboru zamienników" strictly.
  - Tradeoff: Until S-02, a wrong expectation can only be caught by manual review.
  - Confidence: MED — depends on S-02 actually comparing skip lists.
  - Blind spot: S-02 might trust the cases as ground truth instead of challenging them.
- **Decision**: FIXED (Fix A) — order + fallback `missing-skip` checks and 2 negative tests; 51/51 pass

### F2 — Amount and unit after a 1:1 substitution are not checked

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:897-927
- **Detail**: In substituted results, changing the pea-drink amount to 999 or its unit to "g" produces no diagnostic. 360 ml → 360 ml is the core US-01 expectation.
- **Fix**: When an ingredient's productId changes, assert `amount === input.amount * toAmount / fromAmount` and `unit === toUnit`.
- **Decision**: FIXED — `quantity-mismatch` check + negative test; 52/52 pass

### F3 — Unit- and context-mismatch cases aren't checked for an actual mismatch

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:841-851 (compare 656-696)
- **Detail**: Template mismatches are verified present; unit-/context-mismatch skips are not. Setting the 370 g milk to ml, or the pancakes context to `crepes`, still passes → a mislabelled case could tell S-02 to reject a valid recipe.
- **Fix**: For `unit-mismatch`, require the source ingredient's unit ≠ `rule.quantity.fromUnit`; for `context-mismatch`, require `recipe.context` ≠ `rule.context`.
- **Decision**: FIXED — `unit-mismatch-not-present` / `context-mismatch-not-present` + 2 negative tests; 54/54 pass

### F4 — Reference template source unit isn't checked against `fromUnit`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:536-543
- **Detail**: `source-not-in-template` compares only productId. If the reference milk were in grams, both active rules would be dead in their own template and nothing would report it (probe → `[]`).
- **Fix**: Add a diagnostic when the reference recipe's source ingredient unit ≠ `rule.quantity.fromUnit`.
- **Decision**: FIXED — `template-unit-mismatch` check + negative test; 55/55 pass

### F5 — `instruction-mentions-source` is substring-only

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:572-577
- **Detail**: Matches full names and aliases only; "Dodaj też mleko." and inflected "mleka krowiego" pass. Weaker than the name suggests.
- **Fix**: Document it in docs/catalog/README.md as a best-effort guard backed by manual review.
- **Decision**: FIXED — documented in docs/catalog/README.md (boundary section), also listing the F1–F4 checks

### F6 — One missing field hides every other diagnostic for that rule

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:456-472
- **Detail**: `requireFields` failure returns early, skipping reference/context/appliesTo/priority/instruction checks, so fixing a broken rule takes several rounds.
- **Fix**: Validate each present field independently instead of returning early.
- **Decision**: FIXED — rule loop checks each present field independently + test; malformed rules still return diagnostics without throwing; 56/56 pass

### F7 — Duplicate conflict entries and self-duplicate aliases are accepted

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/lib/meal-catalog-check.mjs:217-230, 731-763
- **Detail**: Two identical `expected.conflicts` entries, or an alias normalising to the product's own name, produce `[]`.
- **Fix**: Add `duplicate-reference` diagnostics for both.
- **Decision**: FIXED — `duplicate-reference` for self-duplicate names and repeated conflict entries + 2 tests; 58/58 pass

### F8 — Closed vocabularies typed as `string`, values live only in the checker

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/lib/catalog/types.ts (enum-like fields); scripts/lib/meal-catalog-check.mjs:5-45
- **Detail**: JSON imports widen literals, so `outcome`, `reason`, `caseKind`, `operation`, etc. are `string`; allowed values exist as JS constants in the .mjs and as prose in types.ts — two sources that can drift, and S-02 gets no literal unions.
- **Fix**: When S-02 starts, export literal union types beside the wide boundary types and narrow after `checkCatalog` passes (note in S-02 plan).
- **Decision**: FIXED (deferred) — queued for S-02 in follow-ups/review-fixes.md

### F9 — Benign unplanned additions

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/data/meal-catalog.v1.json:160,175,494; commit 5cba13e
- **Detail**: Drinks also contain `water` and `rapeseed-oil` (not in plan; documented and explicitly approved in catalog-review.md); extra fields `referenceRecipeReview`, `CatalogReview`, `CatalogCaseSet`; Phase-1 commit also carried the starter `eslint.config.js` and `.agents/` metadata-guard scripts (bootstrap of a repo without a base commit; `.agents/` removed in 05afbfc).
- **Fix**: Accept as-is — already approved/cleaned up; no action.
- **Decision**: ACCEPTED — drink composition approved in catalog-review.md; `.agents/` already removed; no action
