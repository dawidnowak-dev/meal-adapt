# Własne wykluczenia z obsługiwanego katalogu — Plan Brief

> Full plan: `context/changes/manage-own-exclusions/plan.md`

## What & Why

S-01 z roadmapy: użytkownik zarządza własnymi wykluczeniami żywieniowymi — przegląda je, dodaje produkty z ustalonego katalogu i usuwa je w dowolnym momencie, na każdym urządzeniu. To pierwsze prywatne dane w aplikacji i warunek S-02, w którym posiłek będzie sprawdzany względem tych wykluczeń. Przy okazji cały interfejs przechodzi na polski.

## Starting Point

Starter ma Supabase Auth, chroniony dashboard i angielski UI. F-01 dostarczył zatwierdzony katalog JSON z czterema wybieralnymi wykluczeniami (mleko krowie, pszenica, orzech włoski, groch). Nie ma jeszcze żadnej tabeli, migracji, polityk RLS ani testów bazy.

## Desired End State

Na stronie `/exclusions` użytkownik dodaje i usuwa wykluczenia ze stanem zapisu i czytelnym błędem. Wyszukiwarka zawęża listę, a dla nazwy spoza katalogu mówi wprost, że ograniczenie nie jest obsługiwane i nie zostanie uwzględnione. Drugie konto nie ma dostępu do cudzych danych, co CI sprawdza testami RLS (pgTAP) i smoke'iem HTTP z dwoma kontami. Wszystkie ekrany są po polsku.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Informacja o braku produktu | Wyszukiwarka + komunikat | Informacja pojawia się wtedy, gdy użytkownik szuka konkretnego produktu, tak jak w FR-003. |
| Reguła dopasowania | Lista zawęża się po podciągu; komunikat, gdy tekst nie jest dokładnie nazwą ani aliasem | „mleko” podpowiada „mleko krowie”, a jednocześnie jasno mówi, że „mleko” samo w sobie nie jest obsługiwane (zgodnie z katalogiem F-01). |
| Interakcja | Wyspa React + JSON API, lista renderowana po stronie serwera | Spełnia wymagania stanu >2 s i komunikatu błędu; API przyda się smoke'owi i S-02. |
| Walidacja w bazie | Zod w API względem katalogu; w DB CHECK formatu sluga i PK | Katalog JSON zostaje jedynym źródłem prawdy, więc nowa wersja katalogu nie wymaga migracji. |
| Test izolacji | pgTAP (RLS) + smoke z dwoma kontami, oba w CI | Filtr w kodzie nie zamaskuje błędnych polityk, a smoke sprawdza całą ścieżkę. |
| Wejście do funkcji | `/exclusions` z linkiem w Topbar i na dashboardzie | Bez zmiany kontraktu logowania i bez wymuszonego onboardingu. |
| Język UI | Polski w całej aplikacji | Spójność z katalogiem i PRD; obejmuje UI startera i błędy auth. |
| Mechanizm API | Zwykłe API routes, bez Astro Actions | Omija ścieżkę `devalue` wskazaną w ocenie audit w deploy-plan. |

## Scope

**In scope:**
- Migracja `user_exclusions` z RLS per operacja i rola
- Testy pgTAP i krok `supabase test db` w CI
- Serwis, DTO i endpointy GET/POST/DELETE z zod
- Smoke z dwoma kontami
- Strona `/exclusions` z wyspą React i nawigacja
- Ocena zgłoszeń zależności dla nowego API
- Polski UI całej aplikacji

**Out of scope:**
- Zmiany katalogu i tabela katalogu w DB
- Własne nazwy wykluczeń
- Redirect po logowaniu i onboarding
- Użycie wykluczeń w generowaniu (S-02)
- Astro Actions i optymistyczny UI
- Odzyskiwanie hasła i szablony e-maili
- Aktualizacja zależności
- Publikacja na staging lub produkcję
- Nowy framework testów

## Architecture / Approach

Tabela przechowuje parę `(user_id, product_id)`, a nazwy pochodzą z katalogu JSON w czasie żądania. Przepływ: strona Astro (SSR, lista + 4 wybieralne produkty) → wyspa React → `fetch` JSON → endpoint (auth, zod, katalog) → serwis → Supabase z JWT użytkownika → RLS. Smoke i pgTAP sprawdzają tę samą granicę z dwóch stron.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Tabela wykluczeń z RLS | Lokalny Supabase, migracja, 6 polityk, testy pgTAP w CI | Instalacja runtime'u kontenerów (dziś brak Dockera); `supabase test db` w CI z wyłączonymi usługami |
| 2. Serwis i API wykluczeń | Endpointy JSON, wyszukiwanie, smoke dwóch kont, ocena audit | Rozbudowa smoke'a bez zależności i bez zmiany istniejących kroków |
| 3. Strona wykluczeń | `/exclusions`, wyspa React, nawigacja, odbiór mobile/desktop | Czytelność komunikatu „nieobsługiwane” obok podpowiedzi |
| 4. Polski interfejs aplikacji | Przetłumaczony starter, nowa strona główna, polskie błędy auth | Pominięte teksty i zmiana kontraktu redirectów auth |

**Prerequisites:** F-01 zamknięte; Node 22.23.3. Runtime kontenerów (Docker Desktop, OrbStack albo colima) — dziś go brak; instalacja i konfiguracja lokalnego Supabase są pierwszym krokiem fazy 1.
**Estimated effort:** ~3–4 sesje po godzinach, po jednej na fazę.

## Open Risks & Assumptions

- `supabase test db` w CI może potrzebować usług wyłączonych flagą `-x`; wtedy trzeba skorygować listę wyłączeń w jobie smoke.
- Zapis z pominięciem API (bezpośrednio REST z kluczem anon, który jest sekretem serwera) mógłby wstawić nieznany slug — ryzyko zaakceptowane, dotyczy tylko własnego konta.
- Publikacja wymaga ręcznego zastosowania migracji w zdalnym Supabase i ponownego odbioru stagingu; to poza tą zmianą.

## Success Criteria (Summary)

- Użytkownik dodaje, usuwa i ponownie dodaje wykluczenia na telefonie i komputerze, a lista zgadza się na innym urządzeniu.
- Szukanie produktu spoza katalogu daje jawny komunikat o braku obsługi, bez możliwości zapisania tekstu.
- Drugie konto nie widzi i nie zmienia cudzych wykluczeń — potwierdzone w CI przez pgTAP i smoke.
