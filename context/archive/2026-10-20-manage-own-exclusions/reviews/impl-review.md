<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Własne wykluczenia z obsługiwanego katalogu

- **Plan**: context/changes/manage-own-exclusions/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-10-20
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 1 warning, 8 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

Evidence summary: every planned item in Phases 1–4 is MATCH (no DRIFT, no MISSING). `signout.ts` is unchanged because it has no user-facing text. Security boundaries verified: every API handler checks `locals.user`; `checkOrigin` is on by default and covers a body-less DELETE; POST is JSON-only and returns 415 otherwise; RLS has 3+3 policies and no update policy; no XSS sinks; the catalog does not reach the client bundle. Automated criteria were re-run at review time: supabase status/db reset/test db (16/16), astro sync/check (0/0), lint, build, smoke 27/27, the English-text grep (empty), check:catalog and test:catalog: all PASS. All manual rows were confirmed by the user in the session.

## Findings

### F1 — Focus loss and no announcement after add or remove

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/components/exclusions/ExclusionsManager.tsx:84-110, 168-175
- **Detail**: "Usuń" removes the `<li>` together with the focused button, so focus falls back to `<body>`. "Dodaj" becomes `disabled` ("Dodane"), which drops focus in most browsers. A successful add or remove is not announced: the `aria-live` regions cover only errors and the unsupported-product message. Keyboard and screen-reader users lose context after every action.
- **Fix**: After a remove, move focus to the next row, or to the section heading or the search field. After an add, move focus to the new item in "Twoje wykluczenia" (or use `aria-disabled` instead of `disabled`). Add a polite status "Dodano X" / "Usunięto X".
  - Strength: Fixes both problems in one component; no API change.
  - Tradeoff: Focus logic needs refs and some manual testing with a keyboard and VoiceOver.
  - Confidence: MED — standard technique, but the best focus target is a UX call.
  - Blind spot: Not checked with a real screen reader.
- **Decision**: FIXED — focus restored after add/remove (data-attribute targets + effect), sr-only role="status" "Dodano/Usunięto: X."; hook actions return boolean

### F2 — Protected pages without Cache-Control: no-store

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/exclusions.astro (also dashboard.astro, pre-existing)
- **Detail**: The SSR page shows the email and exclusions but sets no `Cache-Control`. The edge does not cache it (Workers), but the browser may keep it in the disk cache or back/forward cache after sign-out. The API already sends `no-store`.
- **Fix**: In middleware, set `Cache-Control: private, no-store` on responses for PROTECTED_ROUTES.
- **Decision**: FIXED — middleware sets Cache-Control: private, no-store for PROTECTED_ROUTES (verified on /exclusions and /dashboard)

### F3 — Free text in `?error=` shown on auth pages (pre-existing)

- **Severity**: 💬 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/pages/auth/signin.astro:5, src/pages/auth/signup.astro
- **Detail**: Any text from `?error=` is rendered in the error box. It is escaped, so not XSS, but it allows phishing-style content injection. Messages are now fixed (`auth-errors.ts`), so codes could be passed instead of text. The plan explicitly required the `?error=` format to stay unchanged.
- **Fix**: Redirect with `?error=<code>`, map the code to a message on the page, and show the generic message for unknown codes; loosen smoke to check only the prefix (it already does).
  - Strength: Removes the content-injection class; reuses `auth-errors.ts`.
  - Tradeoff: Changes a contract the plan deliberately kept; goes beyond S-01 scope.
  - Confidence: HIGH — small change in 2 endpoints and 2 pages.
  - Blind spot: Other places that might build `?error=` URLs were not checked.
- **Decision**: FIXED — ?error= carries codes (auth-errors.ts authErrorCode / authErrorMessage); pages map codes to fixed messages, unknown → generic; smoke unchanged (prefix check). Deliberate departure from the plan contract "format ?error= bez zmian", accepted by the user in triage

### F4 — One action clears another action's error

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/hooks/useExclusions.ts:50
- **Detail**: `setError(null)` at the start of every `run`, with one global error slot. If A fails while B is in flight, B's start or end can clear A's message.
- **Fix**: Clear the error only on the next user action for the same product, or keep the error until dismissed or until a later failure.
- **Decision**: FIXED — error state remembers its productId; only a new action on the same product clears it

### F5 — Race in addExclusion's "already exists" path

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/lib/services/exclusions.ts:64-72
- **Detail**: After an insert ignored as a duplicate, `.single()` returns PGRST116 if another tab deleted the row in between, and the user sees a 500. The window is tiny and a retry works.
- **Fix**: On PGRST116, retry the insert once (or accept the risk).
- **Decision**: FIXED — existing-row read uses maybeSingle; insert+read retried once if the row vanished concurrently

### F6 — Hard-coded minimum password length in the message

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/lib/auth-errors.ts:21
- **Detail**: "co najmniej 6 znaków" matches local `config.toml` and the client's MIN_PASSWORD_LENGTH, but will be wrong if the remote Supabase project has a different minimum.
- **Fix**: Take the number from the shared MIN_PASSWORD_LENGTH constant and record in deploy-plan that the remote minimum must match it.
- **Decision**: FIXED — MIN_PASSWORD_LENGTH exported from auth-errors.ts, used by the message and SignUpForm; deploy-plan manual gate 1 requires the remote minimum to match

### F7 — toDTO clones the selectable list per row

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/lib/services/exclusions.ts:24
- **Detail**: `getSelectableExclusions()` is called for every row and copies the list and its aliases. Negligible at 4 products.
- **Fix**: Export a module-level `Map<id, SelectableExclusion>` / `findSelectableExclusion(id)` from selectable-exclusions.ts.
- **Decision**: FIXED — findSelectableExclusion(id) over a module-level Map; isSelectableExclusionId uses the same Map

### F8 — Shared ServerError in the auth folder; duplicated logging

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/components/auth/ServerError.tsx; src/pages/exclusions.astro:22-24
- **Detail**: `ServerError` (now `message: ReactNode`) is used by exclusions as a generic banner but still lives in `components/auth/`. The page repeats the inline `console.error` that `serverError()` in api-response.ts already wraps.
- **Fix**: Move ServerError to `src/components/` and extract `logServerError(operation, error)` into `src/lib/`.
- **Decision**: FIXED — ServerError moved to src/components/ServerError.tsx (4 imports updated); logServerError(source, operation, error) in src/lib/log.ts used by api-response.ts and exclusions.astro

### F9 — Unplanned helpers and ServerError API change

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/lib/api-response.ts, src/lib/auth-errors.ts, src/components/auth/ServerError.tsx
- **Detail**: Three changes are outside the plan's file list. All are benign: they keep the planned error contract consistent and are needed for the 401 link. There is also the "Brak pasujących produktów w katalogu." state in the island. Nothing from "What We're NOT Doing" crept in (no dependency changes, no Actions, no optimistic updates).
- **Fix**: Accept; reviewing them in this report is enough documentation.
- **Decision**: ACCEPTED — benign extras documented in this report (plus src/lib/log.ts and the ServerError move added during triage)
