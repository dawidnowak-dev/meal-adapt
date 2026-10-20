---
project: MealAdapt
version: 1
status: draft
created: 2026-10-18
updated: 2026-10-20
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: validated-meal-and-own-recipes
milestone_seq: 1
milestone_status: open
---

# Roadmap: MealAdapt

> Źródło zakresu: `context/foundation/prd.md` v1 oraz automatycznie zbadany i potwierdzony przez użytkownika stan kodu.
> Dokument jest rozwijany w miejscu; następny kamień milowy kontynuuje ten plik. Archiwizacja dotyczy zastąpienia go niezależną roadmapą.
> Elementy poniżej są w kolejności zależności. Tabela „At a glance” stanowi indeks.

## Milestone

**M-1: Sprawdzony posiłek i własna lista przepisów** — Status: open

- **Intent:** Użytkownik ustawia własne wykluczenia, otrzymuje sprawdzony posiłek z dozwoloną zamianą, może poprosić o inną propozycję, zapisać zaakceptowany przepis i do niego wrócić. Zachowuje prywatność własnych danych oraz możliwość odzyskania dostępu do konta.
- **Source materials:** `context/foundation/prd.md` (v1); pomocniczo `context/foundation/shape-notes.md`, `context/foundation/tech-stack.md`, `context/foundation/infrastructure.md` i `context/deployment/deploy-plan.md`.
- **Done when:** każdy F-NN i S-NN poniżej ma status `done`.
- **Scope anchors:** FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, US-01; Business Logic, Access Control i Non-Functional Requirements z PRD.

Użytkownik potwierdził cel `speed`, pierwszy sprawdzony posiłek z zamianą jako pierwszy dowód wartości oraz `time` jako główne ograniczenie wynikające z pracy po godzinach. Głębsza praca dotyczy danych katalogu, ich prywatności i reguł sprawdzania przepisu: wymusza ją zakaz przedstawiania nierozwiązanego konfliktu jako zgodnego posiłku. Interfejs i infrastruktura pozostają proste i korzystają z istniejącego startera; potrzebne elementy są wprowadzane przy pierwszej funkcji, która ich używa.

## Vision recap

Osoba ze znanymi alergiami pokarmowymi lub świadomymi wykluczeniami żywieniowymi podczas codziennego planowania posiłku dla siebie musi samodzielnie sprawdzać wszystkie składniki przepisu i szukać zamienników. MealAdapt ma proponować posiłki na podstawie ograniczeń podanych przez użytkownika, wykrywać konflikty i dostosowywać składniki, a gdy zamiana nie jest możliwa — proponować inny posiłek. Sprawdzanie ograniczeń nie ma polegać wyłącznie na odpowiedzi modelu AI.

## North star

„North star” oznacza tutaj najmniejszy działający od początku do końca przepływ, który potwierdza główną obietnicę produktu.

**S-02: Użytkownik otrzymuje sprawdzony posiłek z dozwoloną zamianą.** To wybrany przez użytkownika pierwszy sprawdzian wartości: realizuje część US-01 dotyczącą dostosowania i najwcześniej pokazuje, czy generowanie połączone z regułami katalogu działa. F-01 oraz S-01 przygotowują wymagane dane; zapis i powrót do przepisu domykają US-01 w S-03 oraz S-04.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
| --- | --- | --- | --- | --- | --- |
| F-01 | verified-first-meal-catalog | (foundation) dostępny jest zatwierdzony katalog i przykłady odbioru pierwszego posiłku | — | FR-003, FR-005, US-01, Business Logic | done |
| S-01 | manage-own-exclusions | użytkownik może przeglądać, dodawać i usuwać własne wykluczenia | F-01 | FR-003, US-01, Access Control, Non-Functional Requirements | done |
| S-02 | first-validated-meal | użytkownik może otrzymać sprawdzony posiłek z dozwoloną zamianą | F-01, S-01 | FR-004, FR-005, US-01, Business Logic, Non-Functional Requirements | blocked |
| S-03 | save-accepted-meal | użytkownik może zaakceptować propozycję i zapisać ją bez duplikatu | S-02 | FR-007, US-01, Access Control, Non-Functional Requirements | proposed |
| S-04 | reopen-saved-meal | użytkownik może wrócić do przepisu i zobaczyć konflikt z aktualnymi wykluczeniami | S-03 | FR-008, US-01, Access Control, Business Logic, Non-Functional Requirements | proposed |
| S-05 | request-another-meal | użytkownik może odrzucić zgodną propozycję i jednym kliknięciem poprosić o inną | S-02 | FR-006, Business Logic, Non-Functional Requirements | proposed |
| S-06 | recover-account-access | użytkownik może odzyskać hasło przez e-mail i ponownie wejść na własne konto | — | FR-001, Access Control, Non-Functional Requirements | blocked |

## Streams

Pomoc w czytaniu równoległych ścieżek. Kolejność wiążąca wynika z pól Prerequisites; strzałki w tabeli pokazują kolejność czytania w obrębie ścieżki, a odgałęzienia opisano w uwagach.

| Stream | Theme | Chain | Note |
| --- | --- | --- | --- |
| A | Wykluczenia, sprawdzony posiłek i powrót do przepisu | `F-01` → `S-01` → `S-02` → `S-03` → `S-04` → `S-05` | Szybko sprawdza podstawowy przepływ; S-05 odgałęzia się od S-02 i może biec obok S-03–S-04. |
| B | Odzyskanie dostępu | `S-06` | Niezależne od A; może postępować po rozstrzygnięciu zasad wysyłki poczty. |

Pole Parallel with opisuje możliwość niezależnej pracy po spełnieniu wymagań każdego elementu; nie znosi statusu blocked ani oczekiwania na poprzedniki.

## Baseline

Stan kodu zbadany na 2026-10-18 i potwierdzony przez użytkownika. Wybory technologii przyjęto zgodnie z tech-stack.md; sprawdzono zakres istniejącego podłączenia. Wyniki zdalne przytoczono z ostatniego zapisanego odbioru stagingu, bez ponawiania go w tej sesji.

- **Frontend:** present — obecny starter ze stronami i formularzami konta; brak ekranów MealAdapt (`src/pages/index.astro:2`, `src/pages/dashboard.astro:13`).
- **Backend / API:** partial — istnieją rejestracja, logowanie i wylogowanie; brak funkcji produktu oraz integracji AI (`src/pages/api/auth/signup.ts:4`, `src/pages/api/auth/signin.ts:4`, `src/pages/api/auth/signout.ts:4`).
- **Data:** partial — istnieje połączenie z bazą i obsługa sesji; brak katalogu, tabel wykluczeń i przepisów oraz reguł dostępu do tych danych (`src/lib/supabase.ts:5`, `README.md:115`, brak migracji i danych katalogu w `supabase/`).
- **Auth:** partial — istnieją sesja i chroniony dashboard; brak odzyskiwania hasła i ochrony danych produktu (`src/lib/supabase.ts:9`, `src/middleware.ts:4`, `src/middleware.ts:18`).
- **Deploy / infra:** partial — istnieją konfiguracja środowisk i kontrola jakości; zapisany odbiór stagingu potwierdza logowanie przez HTTP i rollback, produkcja pozostaje niewdrożona; kontrola formularzy na telefonie i komputerze oraz ustawień adresu aplikacji pozostaje otwarta (`wrangler.jsonc:3`, `.github/workflows/ci.yml:18`, `context/deployment/deploy-plan.md:243`).
- **Observability:** partial — monitoring jest skonfigurowany, ale zapisany odbiór nie potwierdził odczytu logów ani pomiaru CPU (`wrangler.jsonc:14`, `wrangler.jsonc:22`, `context/deployment/staging-verification.json:23`).

Nie stwierdzono sekcji Forward: technical-roadmap w notatkach. Dokumenty lessons.md i rejestr contract-surfaces.md nie istnieją. Zrealizowanego przygotowania startera i stagingu nie powtarza się jako nowych elementów roadmapy.

## Foundations

### F-01: Sprawdzony katalog do pierwszego dostosowanego posiłku

- **Outcome:** (foundation) twórca przygotował i sprawdził minimalny katalog dla wykluczeń mleka krowiego, pszenicy, orzechów włoskich i grochu oraz wszystkich składników scenariusza US-01, z jawnymi powiązaniami, kolejnością zamienników, proporcjami i zmianami instrukcji potrzebnymi do pierwszej dozwolonej zamiany.
- **Change ID:** verified-first-meal-catalog
- **PRD refs:** FR-003, FR-005, US-01, Business Logic
- **Unlocks:** S-01 — wybór obsługiwanych wykluczeń; S-02 — rozpoznawanie składników i wykonanie pierwszej zamiany; S-04 — sprawdzanie zapisanego przepisu; przypadki odbioru: nieznany składnik, konflikt pośredni, brak dozwolonej zamiany i brak reguł ilości lub instrukcji.
- **Prerequisites:** —
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Bez sprawdzonych danych nie da się ocenić zgodności pierwszego posiłku; fundament obejmuje zakres i przykłady do tego przepływu, a S-01, S-02 i S-04 dopiero udostępnią oraz wykonają te reguły.
- **Status:** done

## Slices

Każda funkcja obejmuje potrzebny interfejs, reguły działania, dane i integracje oraz odbiór na telefonie i komputerze. Zgodnie z PRD użytkownik widzi stan przetwarzania przy operacji trwającej ponad 2 sekundy oraz czytelny wynik niepowodzenia. Odczyt i zapis danych prywatnych podlegają kontroli właściciela, sprawdzanej także próbą dostępu z drugiego konta.

S-01 wprowadza przechowywanie i izolację wykluczeń, S-02 integruje generowanie oraz wykonuje reguły katalogu, a S-03 wprowadza zapis przepisów. S-02 obejmuje także sprawdzenie działania pełnego żądania w istniejącym środowisku, odczyt błędów i pomiar CPU; sama włączona konfiguracja monitoringu nie wystarcza do odbioru. Przed rozszerzeniem serwera ponownie ocenia się zgłoszenia zależności odnotowane w planie wdrożenia, w zakresie zmienianych funkcji.

### S-01: Własne wykluczenia z obsługiwanego katalogu

- **Outcome:** Użytkownik może przeglądać własne wykluczenia, dodawać produkty z ustalonego katalogu i usuwać je także po pierwszym ustawieniu, wracać do nich na innym urządzeniu oraz otrzymać jawną informację, że brakujący produkt nie jest obsługiwany i nie zostanie uwzględniony.
- **Change ID:** manage-own-exclusions
- **PRD refs:** FR-003, US-01, Access Control, Non-Functional Requirements
- **Prerequisites:** F-01
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** To pierwsze zapisane dane użytkownika, więc ich izolacja między kontami musi być sprawdzona wraz z działającym wyborem wykluczeń.
- **Status:** done

### S-02: Pierwszy sprawdzony posiłek z dozwoloną zamianą

- **Outcome:** Użytkownik może poprosić o pojedynczy posiłek zgodny z własnymi wykluczeniami i otrzymać cały przepis sprawdzony według katalogu, z najwyżej jedną rundą zamian według ustalonej kolejności, proporcji i zmian instrukcji oraz ponownym sprawdzeniem całości; nieznany składnik, brak dozwolonej zamiany lub nierozwiązany konflikt odrzuca propozycję, a najwyżej trzy nieudane propozycje kończą żądanie czytelnym niepowodzeniem.
- **Change ID:** first-validated-meal
- **PRD refs:** FR-004, FR-005, US-01, Business Logic, Non-Functional Requirements
- **Prerequisites:** F-01, S-01
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:**
  - Jakiego dostawcę i model AI, zasady przekazywania danych oraz dopuszczalny budżet generowania akceptuje właściciel produktu? — Owner: użytkownik. Block: yes.
- **Risk:** Najwcześniej sprawdza obietnicę dostosowania posiłku; poprawna odpowiedź AI sama w sobie nie stanowi dowodu zgodności z katalogiem.
- **Status:** blocked

### S-03: Akceptacja i jednokrotny zapis propozycji

- **Outcome:** Użytkownik może zaakceptować sprawdzoną propozycję i zapisać jej końcowe składniki, ilości oraz instrukcje na własnej liście, a ponowne zapisanie tej samej wygenerowanej propozycji zachowuje pojedynczy wpis i pokazuje wynik operacji.
- **Change ID:** save-accepted-meal
- **PRD refs:** FR-007, US-01, Access Control, Non-Functional Requirements
- **Prerequisites:** S-02
- **Parallel with:** S-05, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Zapis musi zachować dokładnie zaakceptowaną wersję i pozostać jednokrotny również przy powtórzeniu operacji.
- **Status:** proposed

### S-04: Powrót do przepisu po zmianie wykluczeń

- **Outcome:** Użytkownik może przeglądać własną listę, otworzyć zapisany przepis także na innym urządzeniu i zobaczyć wynik sprawdzenia względem aktualnych wykluczeń; konflikt wyświetla ostrzeżenie i zachowuje przepis bez automatycznych zamian lub usunięcia.
- **Change ID:** reopen-saved-meal
- **PRD refs:** FR-008, US-01, Access Control, Business Logic, Non-Functional Requirements
- **Prerequisites:** S-03
- **Parallel with:** S-05, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Zgodność w chwili zapisu nie gwarantuje zgodności po zmianie wykluczeń, dlatego otwarcie wymaga aktualnego sprawdzenia całego przepisu.
- **Status:** proposed

### S-05: Inna propozycja jednym kliknięciem

- **Outcome:** Użytkownik może jednym kliknięciem „Zaproponuj inny” odrzucić bieżącą zgodną propozycję i uruchomić nowe żądanie generowania z aktualnymi wykluczeniami oraz tymi samymi regułami walidacji i limitem najwyżej trzech propozycji w tym nowym żądaniu.
- **Change ID:** request-another-meal
- **PRD refs:** FR-006, Business Logic, Non-Functional Requirements
- **Prerequisites:** S-02
- **Parallel with:** S-03, S-04, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Nowe żądanie musi przechodzić pełną weryfikację; wcześniejsza zgodna propozycja nie uzasadnia pominięcia sprawdzania kolejnej.
- **Status:** proposed

### S-06: Odzyskanie dostępu do własnego konta

- **Outcome:** Użytkownik może otrzymać link odzyskiwania na swój e-mail, ustawić nowe hasło i ponownie zalogować się na to samo konto; istniejąca rejestracja i logowanie są sprawdzone wraz z dostarczaniem poczty do zwykłego użytkownika spoza zespołu.
- **Change ID:** recover-account-access
- **PRD refs:** FR-001, Access Control, Non-Functional Requirements
- **Prerequisites:** —
- **Parallel with:** F-01, S-01, S-02, S-03, S-04, S-05
- **Blockers:** —
- **Unknowns:**
  - Jaką usługę pocztową i tożsamość nadawcy oraz ewentualny koszt akceptuje właściciel do wysyłania linków odzyskiwania użytkownikom spoza zespołu? — Owner: użytkownik. Block: yes.
- **Risk:** Istniejące logowanie nie dowodzi możliwości odzyskania konta; konieczny jest odbiór rzeczywistej wiadomości i skuteczne ponowne logowanie.
- **Status:** blocked

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
| --- | --- | --- | --- | --- |
| F-01 | verified-first-meal-catalog | Przygotuj i zatwierdź katalog dla pierwszego dostosowanego posiłku | yes | Run `/10x-plan verified-first-meal-catalog`. Pierwszy ruch; umożliwia planowanie i weryfikację S-01 oraz S-02. |
| S-01 | manage-own-exclusions | Pozwól zarządzać własnymi wykluczeniami z katalogu | no | Po F-01; kontrola dostępu do danych powstaje wraz z tą funkcją. |
| S-02 | first-validated-meal | Wygeneruj pierwszy posiłek z weryfikowaną zamianą składników | no | Najpierw decyzja o AI, następnie F-01 i S-01; pierwszy sprawdzian wartości produktu. |
| S-03 | save-accepted-meal | Zapisz zaakceptowaną propozycję raz na własnej liście | no | Po S-02; sprawdzenie izolacji zapisów między właścicielami. |
| S-04 | reopen-saved-meal | Otwórz własny zapisany przepis z kontrolą aktualnych wykluczeń | no | Po S-03; domyka powrót do przepisu z US-01. |
| S-05 | request-another-meal | Zaproponuj inny posiłek jednym kliknięciem | no | Po S-02; może przebiegać równolegle z S-03 i S-04. |
| S-06 | recover-account-access | Przywróć dostęp do konta przez link odzyskiwania hasła | no | Niezależne od przepływu posiłku; najpierw decyzja o poczcie. |

## Open Roadmap Questions

1. **Jakie są przewidywane obciążenie i wolumen danych (target_scale.qps oraz target_scale.data_volume)?** — Ustalono pierwszą wersję dla twórcy i kilku osób, bez szacunków częstotliwości generowania i liczby zapisanych przepisów. Do rozstrzygnięcia przez użytkownika podczas dalszego planowania; data nieustalona.

Owner: użytkownik. Block: —; nie blokuje planowania F-01 ani funkcji dla ustalonego początkowego grona. Odpowiedź posłuży do weryfikacji kosztów i limitów rzeczywistego użycia. Pytanie zachowano powyżej verbatim z PRD; decyzje dotyczące wyłącznie AI i poczty są opisane w Unknowns odpowiednio S-02 i S-06.

## Parked

- **Działanie bez internetu** — Powód odłożenia: PRD §Non-Goals; korzystanie z aplikacji w MVP wymaga połączenia.
- **Import własnych przepisów z tekstu, linku lub pliku** — Powód odłożenia: PRD §Non-Goals; MVP operuje wyłącznie na propozycjach generowanych w aplikacji.
- **Wspólne profile rodzinne i udostępnianie przepisów innym użytkownikom** — Powód odłożenia: PRD §Non-Goals; każdy korzysta z własnego konta i listy.
- **Tygodniowe jadłospisy i rozbudowany planer dietetyczny** — Powód odłożenia: PRD §Non-Goals; MVP skupia się na pojedynczym posiłku.
- **Diagnozowanie alergii i ustalanie, czego użytkownik powinien unikać** — Powód odłożenia: PRD §Non-Goals; użytkownik sam podaje znane ograniczenia.
- **Porady medyczne, diety lecznicze i suplementacja** — Powód odłożenia: PRD §Non-Goals; aplikacja ma pomagać w planowaniu posiłków na podstawie podanych wykluczeń.
- **Integracje ze sklepami i automatyczne zakupy** — Powód odłożenia: PRD §Non-Goals; poza zakresem pierwszej wersji.
- **Zaawansowane liczenie kalorii i makroskładników** — Powód odłożenia: PRD §Non-Goals; pierwsza wersja skupia się na zgodności posiłku z wykluczeniami.
- **Porównywanie podobieństwa osobno wygenerowanych przepisów** — Powód odłożenia: PRD §Non-Goals; zapobieganie duplikatom dotyczy wyłącznie ponownego zapisu tej samej propozycji.
- **Dopisywanie własnych nazw wykluczeń i zgłaszanie brakujących produktów** — Powód odłożenia: PRD §Non-Goals; MVP obsługuje ustalony katalog i jawnie informuje o ograniczeniach jego zakresu.
- **Logowanie przez Google** — Powód odłożenia: PRD §Non-Goals; odłożone poza MVP, aby ograniczyć zakres integracji; w MVP pozostaje e-mail i hasło z odzyskiwaniem dostępu.
- **Edycja i usuwanie zapisanych przepisów** — Powód odłożenia: PRD §Non-Goals; użytkownik uznał przeglądanie za wystarczający zakres MVP poza zapisywaniem zaakceptowanych propozycji.
- **Automatyczna publikacja po połączeniu zmian** — Powód odłożenia: tech-stack.md i deploy-plan.md potwierdzają ręczną publikację; automatyzacja nie jest potrzebna do pierwszego przepływu.

## Milestone History

## Done

- **F-01: (foundation) twórca przygotował i sprawdził minimalny katalog dla wykluczeń mleka krowiego, pszenicy, orzechów włoskich i grochu oraz wszystkich składników scenariusza US-01, z jawnymi powiązaniami, kolejnością zamienników, proporcjami i zmianami instrukcji potrzebnymi do pierwszej dozwolonej zamiany.** — Archived 2026-10-20 → `context/archive/2026-10-18-verified-first-meal-catalog/`. Lesson: —.
- **S-01: Użytkownik może przeglądać własne wykluczenia, dodawać produkty z ustalonego katalogu i usuwać je także po pierwszym ustawieniu, wracać do nich na innym urządzeniu oraz otrzymać jawną informację, że brakujący produkt nie jest obsługiwany i nie zostanie uwzględniony.** — Archived 2026-10-20 → `context/archive/2026-10-20-manage-own-exclusions/`. Lesson: —.
