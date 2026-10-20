# Własne wykluczenia z obsługiwanego katalogu — Implementation Plan

## Overview

Realizujemy S-01 z roadmapy: zalogowany użytkownik przegląda własne wykluczenia, dodaje produkty z ustalonego katalogu, usuwa je także po pierwszym ustawieniu i widzi je na każdym urządzeniu. Gdy szuka produktu spoza katalogu, otrzymuje jawną informację, że takie ograniczenie nie jest obsługiwane i nie zostanie uwzględnione. To pierwsze prywatne dane użytkownika, więc izolacja między kontami jest sprawdzana zarówno w bazie (RLS), jak i przez aplikację. W ramach tej samej zmiany cały interfejs aplikacji przechodzi na język polski.

Plan uzgodniono 2026-10-20: złożoność MEDIUM, siedem pytań merytorycznych (sześć w budżecie i jedno doprecyzowanie po rozszerzeniu budżetu) oraz cztery zatwierdzone fazy.

## Current State Analysis

Starter Astro 7 + React 19 + Supabase Auth ma rejestrację, logowanie, wylogowanie i chroniony `/dashboard`. Nie ma żadnej tabeli produktu, katalogu `supabase/migrations/`, testów bazy ani funkcji produktu. F-01 dostarczył zatwierdzony katalog `src/data/meal-catalog.v1.json` z czterema wybieralnymi wykluczeniami (`cow-milk`, `wheat`, `walnut`, `pea`) o stabilnych slugach, polskich nazwach i aliasach; katalog zawiera też produkty niewybieralne, np. `oat`.

Klient Supabase SSR działa z kluczem anon i JWT użytkownika z ciasteczek, więc polityki RLS są faktycznie egzekwowane przy każdym zapytaniu z serwera aplikacji. Istniejące endpointy auth przyjmują formularze i odpowiadają redirectem z `?error=`; nie walidują wejścia przez zod. UI startera jest po angielsku, a katalog, PRD i baner konfiguracji — po polsku.

Nie ma frame.md, research.md, lessons.md ani rejestru contract-surfaces.md.

## Desired End State

Zalogowany użytkownik otwiera `/exclusions` z linku w nawigacji. Widzi swoje wykluczenia, może dodać dowolny z czterech wybieralnych produktów i usunąć każde wykluczenie. Zmiana jest zapisana w Supabase i widoczna po zalogowaniu na innym urządzeniu. Pole wyszukiwania zawęża listę produktów, a dla tekstu, który nie jest dokładnie nazwą ani aliasem wybieralnego produktu, pokazuje komunikat o braku obsługi bez możliwości zapisania własnej nazwy. Operacje pokazują stan zapisu i czytelny komunikat błędu.

Drugie konto nie widzi, nie dodaje i nie usuwa cudzych wykluczeń, co potwierdzają testy pgTAP polityk RLS i smoke HTTP z dwoma kontami, uruchamiane w CI. Cały interfejs aplikacji, łącznie z formularzami auth, nawigacją i stroną główną, jest po polsku.

### Key Discoveries:

- `context/foundation/roadmap.md:99` — S-01: przeglądanie, dodawanie, usuwanie, wiele urządzeń, informacja o nieobsługiwanym produkcie; ryzyko: izolacja między kontami.
- `context/foundation/prd.md` FR-003 i Access Control — tylko produkty z katalogu, bez dopisywania własnej nazwy; dane widoczne wyłącznie dla właściciela.
- `src/data/meal-catalog.v1.json` — `selectableExclusionIds` to dokładnie cztery slugi; `oat` jest produktem, ale nie wybieralnym wykluczeniem.
- `scripts/lib/meal-catalog-check.mjs:63` i `docs/catalog/README.md:61` — reguła normalizacji nazw (NFC, trim, zwinięcie odstępów, małe litery); „mleko” nie jest aliasem `cow-milk`.
- `src/lib/supabase.ts:5` — klient SSR z kluczem anon i ciasteczkami sesji; zwraca `null` przy braku konfiguracji.
- `src/middleware.ts:4` — `PROTECTED_ROUTES` zawiera tylko `/dashboard`; `context.locals.user` jest ustawiany dla każdego żądania.
- `src/pages/api/auth/signin.ts:4` — obecny wzorzec API to form POST + redirect; brak zod. Zod jest dostępny bez nowej zależności przez `astro/zod` (`node_modules/astro/package.json:71`).
- `context/deployment/deploy-plan.md:211` — `devalue` dotyczy Astro Actions; przed dodaniem nowego API trzeba ponownie ocenić zgłoszenia zależności.
- `.github/workflows/ci.yml:29` — job `smoke` uruchamia lokalny Supabase i smoke przeciw buildowi produkcyjnemu.
- `scripts/smoke.mjs:23` — smoke jest bezzależnościowy, z jednym słoikiem ciasteczek i sprawdzaniem wyłącznie statusu i `Location`.
- `src/components/auth/SubmitButton.tsx:11`, `src/components/auth/ServerError.tsx:7` — istniejące wzorce stanu oczekiwania i komunikatu błędu w React.

## What We're NOT Doing

- Zmiany treści katalogu, nowe wybieralne wykluczenia, tabela katalogu w bazie ani synchronizacja JSON → DB.
- Lista dozwolonych slugów w CHECK bazy — katalog JSON pozostaje jedynym źródłem prawdy (decyzja użytkownika).
- Dopisywanie własnych nazw wykluczeń i zgłaszanie brakujących produktów (PRD §Non-Goals).
- Przekierowanie po logowaniu na `/exclusions` ani wymuszony onboarding; logowanie nadal prowadzi na `/`.
- Użycie wykluczeń w generowaniu i walidacji posiłku — zakres S-02.
- Astro Actions (ścieżka `devalue`), optymistyczne aktualizacje UI, edycja wykluczenia (tylko dodaj/usuń).
- Odzyskiwanie hasła, szablony e-maili Supabase i ich tłumaczenie — zakres S-06.
- Aktualizacja zależności i `npm audit fix`; publikacja na staging/produkcję i odświeżenie manifestu wdrożenia.
- Nowy framework testów jednostkowych dla TypeScript — strategia testów to moduł 3; tutaj pgTAP, smoke i odbiór ręczny.
- Limitowanie żądań i telemetria — przy czterech produktach na użytkownika nie ma czego limitować.

## Implementation Approach

Warstwami od danych do UI. Baza przechowuje wyłącznie parę `(user_id, product_id)` i datę dodania; nazwy, aliasy i wybieralność pochodzą z katalogu JSON w czasie żądania. API waliduje wejście zod względem `selectableExclusionIds`, a baza pilnuje formatu sluga i unikalności. RLS jest właściwą granicą izolacji, a jawny filtr `user_id` w serwisie to dodatkowe zabezpieczenie. Dlatego testy pgTAP sprawdzają polityki bezpośrednio, a smoke sprawdza całą ścieżkę HTTP.

Strona `/exclusions` renderuje listę po stronie serwera, więc działa na każdym urządzeniu bez dodatkowego ładowania. Wyspa React dostaje w propsach tylko cztery wybieralne produkty, nie cały katalog, i komunikuje się z JSON API przez `fetch`. Faza 4 tłumaczy pozostały UI startera niezależnie od funkcji wykluczeń, żeby review każdej części było osobne.

Przyjęte decyzje użytkownika:

- Wyszukiwarka zawęża listę czterech produktów po podciągu znormalizowanej nazwy lub aliasu. Komunikat o braku obsługi pojawia się, gdy niepusty tekst nie jest dokładnie znormalizowaną nazwą ani aliasem wybieralnego produktu. Przykłady: „mle” i „mleko” pokazują „mleko krowie” oraz komunikat; „Mleko  Krowie” nie pokazuje komunikatu; „owies” i „jajka” dają pustą listę i komunikat.
- Wyspa React + JSON API, z listą renderowaną po stronie serwera.
- Walidacja wybieralności w API (zod + katalog), a w bazie tylko CHECK formatu sluga i klucz główny.
- Izolacja sprawdzana przez pgTAP (RLS) i smoke HTTP z dwoma kontami; oba w CI.
- Wejście przez chronioną stronę `/exclusions` z linkiem w Topbar i na dashboardzie, bez zmiany przekierowania po logowaniu.
- Polski interfejs w całej aplikacji, łącznie z UI startera i komunikatami błędów auth.

## Critical Implementation Details

### Granica CSRF dla JSON API

Wbudowane `checkOrigin` Astro (`node_modules/astro/dist/core/app/origin-check.js:8`) odrzuca żądania spoza originu, które nie są GET, HEAD ani OPTIONS, tylko wtedy, gdy mają typ treści formularza (`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`) albo nie mają `Content-Type`. Dlatego `DELETE` bez ciała jest już chroniony. Inne typy treści przechodzą bez sprawdzenia originu, więc `POST /api/exclusions` musi przyjmować wyłącznie `Content-Type: application/json` i odrzucać inne typy kodem 415. Obca strona nie wyśle `application/json` bez preflightu CORS, którego API nie obsługuje.

### Testy RLS bez wycieku stanu

Plik pgTAP tworzy dwóch użytkowników w `auth.users` i przełącza tożsamość przez `set local role authenticated` oraz `request.jwt.claims`. Cały plik działa w jednej transakcji zakończonej `rollback`, więc nie zostawia danych w lokalnej bazie i nie wpływa na smoke uruchamiany po nim.

## Phase 1: Tabela wykluczeń z RLS

### Overview

Przygotować lokalny Supabase, na którym da się uruchomić wszystkie kontrole i odbiór ręczny tej zmiany. Utworzyć pierwszą tabelę danych użytkownika z politykami per operacja i rola. Udowodnić izolację testami pgTAP uruchamianymi lokalnie i w CI.

### Changes Required:

#### 1. Lokalne środowisko Supabase

**Files**: `README.md` (sekcja lokalnego uruchomienia), lokalne `.env` i `.dev.vars` (gitignored, nie commitowane)

**Intent**: Na maszynie deweloperskiej nie ma runtime'u kontenerów ani konfiguracji wskazującej lokalny Supabase. Bez tego `supabase db reset`, `supabase test db`, smoke i odbiór ręczny faz 2–4 nie mają bazy, a staging nie dostaje migracji w tej zmianie.

**Contract**: Kroki są lustrem joba `smoke` z `.github/workflows/ci.yml:38-44`:
1. Zainstalować runtime kontenerów zgodny z Supabase CLI (Docker Desktop, OrbStack albo colima). To jednorazowy krok człowieka; agent zatrzymuje się i prosi o potwierdzenie.
2. Uruchomić `npx supabase start`.
3. Zapisać `SUPABASE_URL` i `SUPABASE_KEY` z `npx supabase status -o env` (API_URL, ANON_KEY) do `.env` i `.dev.vars`.

Istniejące pliki `.env.staging`, `.env.production` i `.dev.vars.staging` pozostają bez zmian. README opisuje te kroki oraz uruchomienie dev na telefonie w tej samej sieci (`npm run dev -- --host`).

#### 2. Migracja tabeli i polityk

**File**: `supabase/migrations/20261020190000_create_user_exclusions.sql`

**Intent**: Zapisać wykluczenia jako identyfikatory produktów z katalogu przypisane do właściciela, tak aby tylko on mógł je czytać, dodawać i usuwać.

**Contract**: Tabela `public.user_exclusions`:
- `user_id uuid not null default auth.uid()` z FK do `auth.users(id) on delete cascade`;
- `product_id text not null` z CHECK formatu sluga `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`;
- `created_at timestamptz not null default now()`;
- `primary key (user_id, product_id)`.

RLS włączone. Polityki dla `authenticated`: osobno select (`using`), insert (`with check`) i delete (`using`), każda z warunkiem `user_id = (select auth.uid())`. Dla `anon` osobne polityki select, insert i delete zwracające `false`. Brak polityki update dla każdej roli. Komentarz SQL na tabeli wskazuje, że `product_id` odnosi się do `selectableExclusionIds` katalogu JSON, a wybieralność waliduje API.

#### 3. Testy izolacji pgTAP

**File**: `supabase/tests/user_exclusions_rls.test.sql`

**Intent**: Dowieść izolacji na poziomie polityk, niezależnie od filtrów w kodzie aplikacji.

**Contract**: Jedna transakcja z `plan(n)`, `finish()` i `rollback`, z dwoma użytkownikami A i B. Na początku transakcji `create extension if not exists pgtap with schema extensions`, żeby test nie zależał od wcześniejszego stanu bazy. Asercje:
- RLS jest włączone na tabeli.
- A dodaje własne wykluczenie.
- A nie może dodać wiersza z `user_id` B (błąd naruszenia polityki).
- A widzi tylko swoje wiersze.
- B nie widzi wierszy A.
- Delete i update wykonane przez B nie zmieniają wiersza A (wiersz A nadal istnieje i jest niezmieniony).
- Update własnego wiersza przez A nie zmienia danych (brak polityki update).
- `anon` nie widzi wierszy i nie może dodać wiersza.
- Duplikat `(user_id, product_id)` jest odrzucany.
- Slug niezgodny z formatem, np. `Mleko krowie`, jest odrzucany przez CHECK.

#### 4. CI i dokumentacja poleceń

**Files**: `.github/workflows/ci.yml`, `README.md`, `CLAUDE.md`

**Intent**: Uruchamiać testy RLS przy każdym push/PR i dać lokalne polecenia do ich uruchomienia.

**Contract**: W jobie `smoke` krok `supabase test db` po starcie lokalnego Supabase i przed buildem. Pozostałe kroki bez zmian. README i sekcja Commands w CLAUDE.md wymieniają `npx supabase db reset` (zastosowanie migracji) i `npx supabase test db` (testy RLS, wymagają Dockera).

### Success Criteria:

#### Automated Verification:

- Lokalny Supabase działa, a aplikacja na niego wskazuje: `npx supabase status` pokazuje uruchomione usługi, a `SUPABASE_URL` w `.env` i `.dev.vars` wskazuje `127.0.0.1`.
- Migracja stosuje się na czystej lokalnej bazie: `npx supabase db reset`.
- Testy RLS przechodzą: `npx supabase test db`.
- Lint przechodzi: `npm run lint`.

#### Manual Verification:

- W lokalnym Studio albo przez `psql` widać tabelę `user_exclusions` z włączonym RLS, sześcioma politykami (3× authenticated, 3× anon) i bez polityki update.

**Implementation Note**: Po przejściu weryfikacji automatycznej zatrzymaj się na potwierdzenie ręcznej weryfikacji przez człowieka, zanim przejdziesz do następnej fazy.

---

## Phase 2: Serwis i API wykluczeń

### Overview

Udostępnić wybieralne produkty z katalogu, logikę wyszukiwania oraz endpointy listy, dodania i usunięcia z walidacją zod i jednolitym formatem błędów JSON. Smoke dowodzi izolacji i pracy na wielu urządzeniach przez HTTP.

### Changes Required:

#### 1. Wybieralne produkty z katalogu

**File**: `src/lib/catalog/selectable-exclusions.ts`

**Intent**: Jedno miejsce po stronie serwera, które odczytuje z katalogu wybieralne wykluczenia z nazwą i aliasami oraz odpowiada, czy dany slug jest wybieralny.

**Contract**:
- `interface SelectableExclusion { id: string; name: string; aliases: string[] }`.
- `getSelectableExclusions(): SelectableExclusion[]` w kolejności `selectableExclusionIds`.
- `isSelectableExclusionId(id: string): boolean`.

Importuje `meal-catalog.v1.json` przez istniejące typy `CatalogData`. Nie trafia do bundla klienta.

#### 2. Wyszukiwanie produktów

**File**: `src/lib/catalog/exclusion-search.ts`

**Intent**: Czysta funkcja realizująca uzgodnioną regułę wyszukiwania, bez importu katalogu, używana przez wyspę React.

**Contract**:
- `normalizeCatalogName(value: string): string` — ta sama reguła co `normalizeName` w `scripts/lib/meal-catalog-check.mjs:63`.
- `searchExclusions(query, items): { matches: SelectableExclusion[]; isUnsupported: boolean }`.

Zachowanie `searchExclusions`:
- Pusty znormalizowany query daje wszystkie `items` i `isUnsupported = false`.
- W przeciwnym razie `matches` to produkty, których znormalizowana nazwa lub alias zawiera query jako podciąg.
- `isUnsupported` jest prawdą, gdy żadna znormalizowana nazwa ani alias nie równa się query.

Przykłady kontraktu: „mle” i „mleko” dają `[cow-milk]` i `isUnsupported = true`; „ Mleko  Krowie ” daje `[cow-milk]` i `false`; „nasiona grochu” daje `[pea]` i `false`; „owies” daje `[]` i `true`.

#### 3. Typy DTO

**File**: `src/types.ts` (nowy plik — konwencja z CLAUDE.md dla typów współdzielonych)

**Intent**: Wspólne kształty odpowiedzi API i stanu UI.

**Contract**:
- `ExclusionDTO { productId: string; name: string; supported: boolean; createdAt: string }`.
- `ExclusionListDTO { exclusions: ExclusionDTO[] }`.
- `AddExclusionCommand { productId: string }`.
- `ApiErrorDTO { error: { code: string; message: string } }`, gdzie `message` jest polskim komunikatem dla użytkownika.

Wiersz z `product_id` spoza obecnych `selectableExclusionIds` ma `supported: false` i `name` równe slugowi.

#### 4. Serwis wykluczeń

**File**: `src/lib/services/exclusions.ts`

**Intent**: Zapytania do `user_exclusions` w jednym miejscu, mapowane na DTO z nazwami z katalogu.

**Contract**:
- `listExclusions(supabase, userId): Promise<ExclusionDTO[]>`, posortowane po `created_at`, potem `product_id`.
- `addExclusion(supabase, userId, productId): Promise<{ exclusion: ExclusionDTO; created: boolean }>` — insert z `on conflict do nothing`; istniejące wykluczenie daje `created: false`.
- `removeExclusion(supabase, userId, productId): Promise<void>` — idempotentne.

Każde zapytanie ma jawny filtr `user_id` jako dodatkowe zabezpieczenie oprócz RLS. Błąd Supabase jest zgłaszany wyjątkiem z kodem dla warstwy API; serwis nie formatuje odpowiedzi HTTP.

#### 5. Endpointy

**Files**: `src/pages/api/exclusions/index.ts`, `src/pages/api/exclusions/[productId].ts`

**Intent**: JSON API dla wyspy i smoke, z jednolitą walidacją i błędami.

**Contract**: Oba pliki eksportują `prerender = false`. Wspólne odpowiedzi błędów:
- brak `locals.user` → 401 `unauthorized`;
- brak klienta Supabase → 503 `config-missing`;
- błąd bazy → 500 `server-error` z ogólnym polskim komunikatem; szczegóły trafiają do `console.error` bez danych osobowych.

Endpointy:
- `GET /api/exclusions` → 200 `ExclusionListDTO`.
- `POST /api/exclusions` — tylko `application/json`, inny typ → 415 `unsupported-media-type`. Ciało jest walidowane schematem `z.object({ productId: z.string() })` z `astro/zod`. Niepoprawny JSON lub kształt → 400 `invalid-body`. Slug spoza `selectableExclusionIds` → 400 `unsupported-product` z komunikatem „Ten produkt nie jest obsługiwanym wykluczeniem i nie zostanie uwzględniony.”. Odpowiedź 201 `{ exclusion }` przy utworzeniu, 200 przy istniejącym.
- `DELETE /api/exclusions/[productId]` — parametr musi mieć format sluga, inaczej 400 `invalid-product-id`. Nie wymaga wybieralności, aby dało się usunąć wpis, który wypadł z katalogu. Zawsze 204, także gdy wiersza nie było albo należy do innego konta.

#### 6. Smoke z dwoma kontami

**File**: `scripts/smoke.mjs`

**Intent**: Sprawdzić przez HTTP przeciw buildowi produkcyjnemu izolację między kontami, idempotencję i odczyt z „innego urządzenia”. Skrypt pozostaje bez zależności.

**Contract**: Osobne słoiki ciasteczek dla kont A i B oraz trzeci dla nowej sesji A. Obsługa ciała JSON w żądaniu i sprawdzanie ciała odpowiedzi. Istniejące kroki zachowują znaczenie i oczekiwania. Nowe kroki:
1. Anonimowy `GET /api/exclusions` → 401.
2. A dodaje `cow-milk` → 201; ponownie → 200.
3. A dodaje `oat` i `mleko` → 400 `unsupported-product`; ciało nie-JSON → 415.
4. A widzi dokładnie `[cow-milk]`.
5. Nowa sesja A (świeży słoik, ponowne logowanie) widzi `[cow-milk]`.
6. B widzi pustą listę.
7. `DELETE` B na `cow-milk` → 204, a A nadal widzi `[cow-milk]`.
8. A usuwa `cow-milk` → 204; lista pusta; powtórne usunięcie → 204.

#### 7. Ocena zgłoszeń zależności dla nowego API

**File**: `context/deployment/deploy-plan.md`

**Intent**: Spełnić warunek z `deploy-plan.md:211` przed rozszerzeniem serwera.

**Contract**: Nowy wpis z datą w dzienniku oceny audit. Zawiera wynik `npm audit --omit=dev`, potwierdzenie, że nowe endpointy nie używają Astro Actions ani `devalue`/`uneval` w ścieżce żądania, oraz wniosek o osiągalności. Bez `audit fix` i bez zmian lockfile.

### Success Criteria:

#### Automated Verification:

- Kontrola typów i lint przechodzą: `npx --no-install astro sync`, `npx --no-install astro check` i `npm run lint`.
- Build produkcyjny przechodzi: `npm run build`.
- Smoke z dwoma kontami przechodzi przeciw `npm run preview` z lokalnym Supabase: `BASE_URL=http://localhost:4321 npm run smoke`.
- Testy RLS nadal przechodzą: `npx supabase test db`.

#### Manual Verification:

- Wpis oceny zgłoszeń zależności w `deploy-plan.md` jest przejrzany i wniosek zaakceptowany.

**Implementation Note**: Po przejściu weryfikacji automatycznej zatrzymaj się na potwierdzenie ręcznej weryfikacji przez człowieka, zanim przejdziesz do następnej fazy.

---

## Phase 3: Strona wykluczeń

### Overview

Dać użytkownikowi chronioną stronę do zarządzania wykluczeniami, działającą na telefonie i komputerze, ze stanem zapisu, błędami i komunikatem o nieobsługiwanym produkcie.

### Changes Required:

#### 1. Strona i ochrona trasy

**Files**: `src/pages/exclusions.astro`, `src/middleware.ts`

**Intent**: Serwerowo wyrenderowana strona z bieżącą listą użytkownika i wybieralnymi produktami, dostępna tylko po zalogowaniu.

**Contract**: `/exclusions` dodane do `PROTECTED_ROUTES`; anonimowy użytkownik dostaje redirect na `/auth/signin`. Strona pobiera `listExclusions` i `getSelectableExclusions` i przekazuje je jako propsy do wyspy `client:load`. Błąd odczytu renderuje czytelny polski komunikat zamiast wyspy. Tytuł strony to „Wykluczenia”.

#### 2. Wyspa zarządzania i hook

**Files**: `src/components/exclusions/ExclusionsManager.tsx` (i ewentualne podkomponenty w `src/components/exclusions/`), `src/components/hooks/useExclusions.ts`

**Intent**: Interakcja dodawania, usuwania i wyszukiwania zgodna z uzgodnioną regułą komunikatu.

**Contract**: Hook trzyma listę `ExclusionDTO[]`, stan oczekiwania per `productId` i ostatni błąd. Wywołuje `POST`/`DELETE /api/exclusions` i aktualizuje stan dopiero po odpowiedzi serwera, bez optymistycznych zmian.

Komponent ma dwie sekcje:
- **„Twoje wykluczenia”** — nazwa i przycisk „Usuń”. Wpis z `supported: false` jest oznaczony jako nieobsługiwany w obecnym katalogu i nadal da się go usunąć. Pusta lista pokazuje stan pusty.
- **„Dodaj z katalogu”** — pole wyszukiwania z etykietą i lista z `searchExclusions`. Produkty już dodane mają nieaktywny stan „Dodane”, pozostałe przycisk „Dodaj”. Przy `isUnsupported` w regionie `aria-live="polite"` pojawia się komunikat: „„{tekst}” nie jest obsługiwanym wykluczeniem i nie zostanie uwzględnione. Wybierz produkt z listy.”. Nie ma akcji zapisania wpisanego tekstu.

Kliknięty przycisk od razu przechodzi w stan oczekiwania („Zapisywanie…” / „Usuwanie…”, spinner, `disabled`), co spełnia wymaganie wskaźnika przy operacji powyżej 2 s. Komunikaty błędów:
- błąd API — `message` z `ApiErrorDTO`;
- błąd sieci — „Nie udało się zapisać zmian. Sprawdź połączenie i spróbuj ponownie.”;
- 401 — informacja o wygaśnięciu sesji z linkiem do logowania.

Komunikat błędu korzysta ze stylu `ServerError`. Klasy łączone przez `cn()`. Układ jednokolumnowy na wąskim ekranie, cele dotykowe co najmniej 44 px.

#### 3. Nawigacja i smoke strony

**Files**: `src/components/Topbar.astro`, `src/pages/dashboard.astro`, `scripts/smoke.mjs`

**Intent**: Uczynić funkcję osiągalną i objąć ochronę strony smoke'iem.

**Contract**: Link „Wykluczenia” do `/exclusions` w Topbar dla zalogowanego i na dashboardzie. Nowe kroki smoke:
- anonimowy `GET /exclusions` → 302 na `/auth/signin`;
- zalogowany A → 200.

### Success Criteria:

#### Automated Verification:

- Kontrola typów, lint i build przechodzą: `npx --no-install astro check`, `npm run lint` i `npm run build`.
- Smoke przechodzi przeciw `npm run preview` z lokalnym Supabase, w tym ochrona `/exclusions`: `BASE_URL=http://localhost:4321 npm run smoke`.

#### Manual Verification:

- Na telefonie (lub DevTools ~375 px) i na komputerze można dodać, usunąć i ponownie dodać wykluczenie; po odświeżeniu stan się zgadza.
- Inna przeglądarka zalogowana na to samo konto widzi te same wykluczenia po odświeżeniu, a drugie konto ich nie widzi.
- Wyszukiwanie: „mle” i „mleko” pokazują „mleko krowie” z komunikatem; „Mleko  Krowie” bez komunikatu; „owies” i „jajka” dają pustą listę z komunikatem; nie da się zapisać wpisanego tekstu.
- Przy dławieniu sieci (Slow 3G) przycisk pokazuje stan zapisu; w trybie offline pojawia się czytelny błąd, a lista się nie zmienia.

**Implementation Note**: Po przejściu weryfikacji automatycznej zatrzymaj się na potwierdzenie ręcznej weryfikacji przez człowieka, zanim przejdziesz do następnej fazy.

---

## Phase 4: Polski interfejs aplikacji

### Overview

Przetłumaczyć pozostały UI startera na polski i zastąpić reklamową stronę główną startera krótką stroną MealAdapt.

### Changes Required:

#### 1. Layout i strona główna

**Files**: `src/layouts/Layout.astro`, `src/components/Welcome.astro`, `src/pages/index.astro`

**Intent**: Dokument w języku polskim i strona główna opisująca produkt zamiast startera.

**Contract**: `<html lang="pl">`, domyślny tytuł „MealAdapt”. Strona główna zawiera nazwę, jedno zdanie o wartości produktu i wezwanie do działania:
- niezalogowany — „Zaloguj się” / „Załóż konto”;
- zalogowany — „Zarządzaj wykluczeniami”.

Karty reklamowe startera zostają usunięte. Kod `Welcome.astro` można zastąpić albo przemianować, jeśli nic innego go nie używa.

#### 2. Nawigacja, dashboard i strony auth

**Files**: `src/components/Topbar.astro`, `src/pages/dashboard.astro`, `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`, `src/pages/auth/confirm-email.astro`, `src/components/auth/*.tsx`

**Intent**: Wszystkie widoczne teksty po polsku.

**Contract**: Tłumaczone są etykiety, placeholdery, przyciski, teksty stanu oczekiwania, walidacja po stronie klienta, aria-label i tytuły stron. Trasy, nazwy pól formularzy i zachowanie się nie zmieniają.

#### 3. Komunikaty błędów auth

**Files**: `src/pages/api/auth/signin.ts`, `src/pages/api/auth/signup.ts`, `src/pages/api/auth/signout.ts`

**Intent**: Użytkownik dostaje polski komunikat zamiast surowego tekstu Supabase.

**Contract**: Mapowanie po `error.code` z AuthError:
- nieprawidłowe dane logowania → „Nieprawidłowy e-mail lub hasło.”;
- istniejący użytkownik (`user_already_exists` lub `email_exists`) → „Konto z tym adresem e-mail już istnieje.”;
- słabe hasło → komunikat o wymaganiach hasła;
- pozostałe → ogólny komunikat operacji;
- brak konfiguracji → „Brak konfiguracji Supabase.”.

Format `?error=` i lokalizacje redirectów pozostają bez zmian, więc smoke działa bez modyfikacji.

Komunikat o istniejącym koncie pojawia się tylko przy wyłączonych potwierdzeniach e-mail, jak lokalnie (`supabase/config.toml:209`). Przy włączonych potwierdzeniach Supabase chroni przed enumeracją kont: nie zwraca błędu, a użytkownik trafia na ekran potwierdzenia e-maila. To zamierzone zachowanie i nie obchodzimy go.

### Success Criteria:

#### Automated Verification:

- Kontrola typów, lint i build przechodzą: `npx --no-install astro check`, `npm run lint` i `npm run build`.
- Smoke przechodzi bez zmian oczekiwań auth: `BASE_URL=http://localhost:4321 npm run smoke`.
- W UI nie zostały angielskie teksty startera: `grep -rnE 'Sign (in|out|up)|Not signed in|is required|Welcome,|Create account|Forgot|Authentication Ready|Modern Stack|Dashboard|"Email"|"Password"|Your password' src/components src/pages src/layouts` nie zwraca wyników.

#### Manual Verification:

- Przejście przez stronę główną, rejestrację, potwierdzenie e-maila, logowanie, dashboard, wykluczenia i wylogowanie na telefonie i komputerze — wszystkie teksty po polsku.
- Lokalnie (potwierdzenia e-mail wyłączone) błędne hasło i rejestracja istniejącego adresu pokazują polskie komunikaty.

**Implementation Note**: Po przejściu weryfikacji automatycznej zatrzymaj się na potwierdzenie ręcznej weryfikacji przez człowieka przed zamknięciem zmiany.

---

## Testing Strategy

### Unit Tests:

Bez nowego frameworka testów (moduł 3). Polityki RLS testuje pgTAP jako testy jednostkowe warstwy danych: izolacja odczytu, zapisu i usuwania, brak update, rola anon, unikalność i format sluga. Reguła wyszukiwania ma przykłady w kontrakcie fazy 2 i jest odbierana ręcznie w fazie 3.

### Integration Tests:

Smoke HTTP przeciw buildowi produkcyjnemu z lokalnym Supabase:
- dwa konta i nowa sesja tego samego konta;
- odrzucenie produktów spoza katalogu (`oat`, `mleko`);
- 415 dla typu innego niż JSON i 401 dla anonimowego;
- idempotencja dodania i usunięcia;
- ochrona `/exclusions`.

W CI job `smoke` uruchamia najpierw `supabase test db`, potem smoke.

### Manual Testing Steps:

1. Zalogować się na telefonie (lub DevTools ~375 px), dodać „mleko krowie” i „groch”, usunąć „groch”, dodać go ponownie.
2. Otworzyć `/exclusions` w drugiej przeglądarce na tym samym koncie i potwierdzić tę samą listę.
3. Zalogować się na drugie konto i potwierdzić pustą listę.
4. Sprawdzić wyszukiwanie: „mle”, „mleko”, „Mleko  Krowie”, „nasiona grochu”, „owies”, „jajka”.
5. Włączyć Slow 3G i offline i sprawdzić stan zapisu oraz komunikat błędu.
6. Przejść cały UI po polsku, w tym błędne logowanie i ponowną rejestrację.

## Performance Considerations

Najwyżej cztery wiersze na użytkownika; odczyt po kluczu głównym. Strona wykonuje jedno zapytanie przy renderowaniu, a każda akcja jedno żądanie. Polityki używają `(select auth.uid())`, aby funkcja nie była wywoływana per wiersz. Do bundla klienta trafiają tylko cztery produkty, nie cały katalog.

## Migration Notes

Pierwsza migracja projektu; brak istniejących danych. Wycofanie wymaga nowej migracji usuwającej tabelę, a nie edycji zastosowanej. Usunięcie konta kasuje jego wykluczenia (`on delete cascade`). Jeżeli przyszła wersja katalogu usunie slug z `selectableExclusionIds`, istniejące wiersze pozostają, są pokazywane jako nieobsługiwane i można je usunąć. Konsumenci (S-02, S-04) muszą wtedy jawnie zdecydować o ich traktowaniu.

Nowe źródła unieważniają zapisany manifest stagingu. Przed publikacją trzeba zastosować migrację w zdalnym projekcie Supabase i ponownie odebrać staging według `context/deployment/deploy-plan.md`; ta zmiana tego nie robi.

## References

- Tożsamość zmiany: `context/changes/manage-own-exclusions/change.md`.
- Zakres i zależności: `context/foundation/roadmap.md` — S-01 (wiersz 99), zasady slices (wiersz 95).
- Wymagania: `context/foundation/prd.md` — FR-003, US-01, Access Control, Non-Functional Requirements, Non-Goals.
- Katalog i jego reguły: `src/data/meal-catalog.v1.json`, `src/lib/catalog/types.ts`, `docs/catalog/README.md:61`, archiwum F-01 `context/archive/2026-10-18-verified-first-meal-catalog/plan.md`.
- Wzorce kodu: `src/lib/supabase.ts:5`, `src/middleware.ts:4`, `src/pages/api/auth/signin.ts:4`, `src/components/auth/SubmitButton.tsx:11`, `src/components/auth/ServerError.tsx:7`, `scripts/smoke.mjs:23`, `.github/workflows/ci.yml:29`.
- Zależności i wdrożenie: `context/deployment/deploy-plan.md:205-213`.
- Decyzje: siedem odpowiedzi użytkownika w sesji planowania 2026-10-20 i zatwierdzenie czterech faz.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Tabela wykluczeń z RLS

#### Automated

- [x] 1.1 Lokalny Supabase działa, a aplikacja na niego wskazuje: `npx supabase status` pokazuje uruchomione usługi, a `SUPABASE_URL` w `.env` i `.dev.vars` wskazuje `127.0.0.1`. — a852e6f
- [x] 1.2 Migracja stosuje się na czystej lokalnej bazie: `npx supabase db reset`. — a852e6f
- [x] 1.3 Testy RLS przechodzą: `npx supabase test db`. — a852e6f
- [x] 1.4 Lint przechodzi: `npm run lint`. — a852e6f

#### Manual

- [x] 1.5 W lokalnym Studio albo przez `psql` widać tabelę `user_exclusions` z włączonym RLS, sześcioma politykami (3× authenticated, 3× anon) i bez polityki update. — a852e6f

### Phase 2: Serwis i API wykluczeń

#### Automated

- [x] 2.1 Kontrola typów i lint przechodzą: `npx --no-install astro sync`, `npx --no-install astro check` i `npm run lint`. — b0bee6a
- [x] 2.2 Build produkcyjny przechodzi: `npm run build`. — b0bee6a
- [x] 2.3 Smoke z dwoma kontami przechodzi przeciw `npm run preview` z lokalnym Supabase: `BASE_URL=http://localhost:4321 npm run smoke`. — b0bee6a
- [x] 2.4 Testy RLS nadal przechodzą: `npx supabase test db`. — b0bee6a

#### Manual

- [x] 2.5 Wpis oceny zgłoszeń zależności w `deploy-plan.md` jest przejrzany i wniosek zaakceptowany. — b0bee6a

### Phase 3: Strona wykluczeń

#### Automated

- [x] 3.1 Kontrola typów, lint i build przechodzą: `npx --no-install astro check`, `npm run lint` i `npm run build`. — 478b220
- [x] 3.2 Smoke przechodzi przeciw `npm run preview` z lokalnym Supabase, w tym ochrona `/exclusions`: `BASE_URL=http://localhost:4321 npm run smoke`. — 478b220

#### Manual

- [x] 3.3 Na telefonie (lub DevTools ~375 px) i na komputerze można dodać, usunąć i ponownie dodać wykluczenie; po odświeżeniu stan się zgadza. — 478b220
- [x] 3.4 Inna przeglądarka zalogowana na to samo konto widzi te same wykluczenia po odświeżeniu, a drugie konto ich nie widzi. — 478b220
- [x] 3.5 Wyszukiwanie: „mle” i „mleko” pokazują „mleko krowie” z komunikatem; „Mleko  Krowie” bez komunikatu; „owies” i „jajka” dają pustą listę z komunikatem; nie da się zapisać wpisanego tekstu. — 478b220
- [x] 3.6 Przy dławieniu sieci (Slow 3G) przycisk pokazuje stan zapisu; w trybie offline pojawia się czytelny błąd, a lista się nie zmienia. — 478b220

### Phase 4: Polski interfejs aplikacji

#### Automated

- [x] 4.1 Kontrola typów, lint i build przechodzą: `npx --no-install astro check`, `npm run lint` i `npm run build`.
- [x] 4.2 Smoke przechodzi bez zmian oczekiwań auth: `BASE_URL=http://localhost:4321 npm run smoke`.
- [x] 4.3 W UI nie zostały angielskie teksty startera: `grep -rnE 'Sign (in|out|up)|Not signed in|is required|Welcome,|Create account|Forgot|Authentication Ready|Modern Stack|Dashboard|"Email"|"Password"|Your password' src/components src/pages src/layouts` nie zwraca wyników.

#### Manual

- [x] 4.4 Przejście przez stronę główną, rejestrację, potwierdzenie e-maila, logowanie, dashboard, wykluczenia i wylogowanie na telefonie i komputerze — wszystkie teksty po polsku.
- [x] 4.5 Lokalnie (potwierdzenia e-mail wyłączone) błędne hasło i rejestracja istniejącego adresu pokazują polskie komunikaty.
