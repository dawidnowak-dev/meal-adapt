# Review follow-ups — verified-first-meal-catalog

Source: [reviews/impl-review.md](../reviews/impl-review.md) (2026-10-19).

## F8 — Literal union types for closed vocabularies (for the S-02 plan)

- **Where**: `src/lib/catalog/types.ts`; allowed values today in `scripts/lib/meal-catalog-check.mjs` (constants `OUTCOMES`, `REASONS_BY_OUTCOME`, `SKIP_REASONS`, `INSTRUCTION_OPERATIONS`, `REQUIRED_CASE_KINDS`, `TEMPLATE_MISMATCH_KINDS`).
- **Problem**: JSON imports widen literals, so `outcome`, `reason`, `caseKind`, `operation`, `templateMismatch` and skip reasons are typed as `string`. The allowed values exist only as JS constants in the checker and as prose in types.ts, so the two can drift, and S-02 code has nothing to narrow on.
- **Action when S-02 starts**: export literal union types (e.g. `CatalogOutcome = "accepted" | "substituted" | "rejected"`) beside the wide JSON-boundary types, and narrow to them only after `checkCatalog` passes. Keep a single source for the value lists, either by deriving the checker constants from one shared module or by adding a test that compares both.
- **Not done now**: changing the boundary types would widen the F-01 scope beyond the plan. The JSON data is unaffected.
