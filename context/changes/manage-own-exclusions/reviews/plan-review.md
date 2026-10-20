<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Własne wykluczenia z obsługiwanego katalogu

- **Plan**: context/changes/manage-own-exclusions/plan.md
- **Mode**: Deep (claims verified locally, no sub-agent)
- **Date**: 2026-10-20
- **Verdict**: REVISE → SOUND after triage
- **Findings**: 1 critical, 1 warning, 1 observation

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | FAIL |

## Grounding

- Paths: 11/12 ✓ (`src/types.ts` nie istnieje → F3).
- Symbols ✓: `astro/zod` → zod 4.6.2, `normalizeName`, `PROTECTED_ROUTES`, kody AuthError w auth-js 2.116.
- Brief↔plan ✓.
- Progress↔Phase ✓ (20/20 przed triage, 21/21 po).

## Findings

### F1 — Weryfikacji faz nie da się uruchomić lokalnie

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Fazy 1–4 (kryteria 1.1, 1.2, 2.3, 2.4, 3.2, 4.2 i odbiór ręczny faz 3–4); brief: Prerequisites
- **Detail**: Na maszynie deweloperskiej nie ma Dockera (ani OrbStack, colima czy podman) ani lokalnego `.env` lub `.dev.vars`; są tylko pliki stagingu i produkcji. `supabase db reset`, `supabase test db` i smoke przeciw lokalnemu Supabase wymagają kontenerów. Staging nie dostaje migracji w tej zmianie, więc odbiór ręczny nie miałby bazy.
- **Fix A ⭐ Recommended**: Lokalny Supabase jako jawny krok fazy 1 (runtime kontenerów, `npx supabase start`, `.env` i `.dev.vars` z `supabase status -o env` jak w CI, README).
  - Strength: Wszystkie kryteria działają bez zmian; lustro joba smoke w CI.
  - Tradeoff: Jednorazowa instalacja runtime'u kontenerów.
  - Confidence: HIGH — ten sam przepis działa w CI.
  - Blind spot: Dostęp z telefonu przez `--host` w LAN niesprawdzony.
- **Fix B**: CI jako weryfikator + `supabase db push` na staging.
  - Strength: Bez Dockera lokalnie.
  - Tradeoff: Zmiana zdalnej bazy i ponowny odbiór stagingu, sprzeczne z zakresem.
  - Confidence: MED.
  - Blind spot: Wolna pętla zwrotna.
- **Decision**: FIXED (Fix A) — nowy krok 1 w fazie 1, nowe kryterium 1.1, przenumerowany Progress fazy 1, zaktualizowany brief.

### F2 — Komunikat „konto już istnieje” zależy od potwierdzeń e-mail

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Faza 4 — Komunikaty błędów auth; kryterium 4.5
- **Detail**: Lokalnie `enable_confirmations = false`, więc signUp zwraca `user_already_exists`. Przy włączonych potwierdzeniach Supabase nie zwraca błędu (ochrona przed enumeracją). Plan nie mapował kodu `email_exists`.
- **Fix**: Mapować `user_already_exists` i `email_exists`; zawęzić 4.5 do środowiska lokalnego i opisać zachowanie hosted.
- **Decision**: FIXED

### F3 — Drobne nieścisłości kontraktów

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Faza 1 (#3), Faza 2 (#3), Critical Implementation Details, kryterium 4.3
- **Detail**:
  - (a) `src/types.ts` to nowy plik.
  - (b) Brak `create extension if not exists pgtap`.
  - (c) `checkOrigin` blokuje też żądania cross-origin bez Content-Type (`origin-check.js:16`), więc DELETE jest już chroniony.
  - (d) Grep 4.3 nie łapał „Dashboard”, „Email”, „Password”.
- **Fix**: Cztery punktowe poprawki w planie.
- **Decision**: FIXED
