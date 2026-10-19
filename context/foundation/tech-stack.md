---
starter_id: 10x-astro-starter
package_manager: npm
project_name: meal-adapt
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-workers
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: true
  has_background_jobs: false
---

## Why this stack

### Deployment tooling correction — 2026-10-08

Pierwsze wdrożenie używa Node.js **22.23.3** (.nvmrc) zamiast starterowego 22.14.0. Instalacja z istniejącego lockfile wykazała wymaganie Node ^22.22.3 dla eslint-plugin-astro/astro-eslint-parser oraz >=22.19.0 dla undici. Zmieniono wyłącznie pin narzędzi w obrębie Node 22 LTS; runtime produkcyjny pozostaje Cloudflare Workers. Pierwszy deploy jest ręczny, a automatyzacja po merge pozostaje odłożonym celem. Zakres pierwszej publikacji to techniczne demo startera, z wyłączonym potwierdzaniem e-maila; pełny zakres produktu pozostaje opisany w PRD.

MealAdapt to aplikacja webowa dla twórcy i kilku osób, z MVP planowanym na trzy tygodnie pracy po godzinach. Użytkownik zaakceptował rekomendowany 10x Astro Starter: Astro, React, TypeScript, Tailwind CSS i Supabase. Jawne typy, konwencje projektu oraz przygotowana obsługa podstawowego logowania ograniczają koszt startu; Supabase zapewnia PostgreSQL do przechowywania wykluczeń i zapisanych przepisów. Integracja AI, deterministyczna walidacja składników, reguły zamian, odzyskiwanie hasła i kontrola dostępu do danych wymagają implementacji lub konfiguracji dla MealAdapt. Użytkownik potwierdził Cloudflare Workers zgodnie z [aktualną dokumentacją startera](https://github.com/przeprogramowani/10x-astro-starter#deployment), świadomie zastępując Cloudflare Pages wskazane w lokalnym rejestrze. Wybrano npm, nazwę meal-adapt oraz GitHub Actions z automatycznym wdrożeniem po merge do głównej gałęzi. Pewność przygotowania projektu wynosi first-class: starter ma zarejestrowane polecenie inicjalizacji, ale cały proces nie był zweryfikowany od początku do końca i może wymagać ręcznych kroków. MVP wymaga kont i AI; płatności, komunikacja realtime i zadania w tle nie są częścią ustalonego zakresu.
