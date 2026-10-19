# Sprawdzony katalog pierwszego posiłku — Implementation Plan

## Overview

Realizujemy F-01 z roadmapy: minimalny katalog produktów i reguł potrzebnych do pierwszej zamiany mleka krowiego w naleśnikach oraz przykłady odbioru dla kolejnych funkcji. Rezultatem są sprawdzone dane i kontrakty, które wykorzystają S-01, S-02 i S-04.

Plan uzgodniono 2026-10-18: złożoność MEDIUM, pięć pytań merytorycznych i trzy zatwierdzone fazy. Użytkownik przekazał przygotowanie propozycji danych agentowi; zatwierdzenie treści nastąpi przy odbiorze implementacji.

## Current State Analysis

Repozytorium zawiera starter Astro/React/TypeScript z Supabase Auth. Brakuje katalogu, modelu produktów, reguł zamian, migracji produktu i testów danych domenowych. Dostępne są lint, kontrola typów, build oraz osobny smoke uwierzytelniania.

PRD ustala cztery początkowe wykluczenia, odrzucanie nieznanego składnika, wybór pierwszego dozwolonego zamiennika z uporządkowanej listy oraz obowiązek zapisania proporcji i zmian instrukcji. Jedna runda zamian, ponowna walidacja całości i najwyżej trzy propozycje na żądanie są kontraktem S-02; F-01 dostarcza dla niego dane i oczekiwania.

Nie ma wcześniejszego frame.md, research.md, lessons.md ani rejestru contract-surfaces.md. Zbadano dokumenty foundation i kod startera. Wszystkie pliki projektu są obecnie nieśledzone, a repo nie ma pierwszego commitu; stan ten trzeba uwzględnić przy późniejszym rytuale commitowania pojedynczej fazy.

## Desired End State

W repozytorium znajduje się wersjonowany katalog z czterema wybieralnymi wykluczeniami i kompletem produktów przykładowych naleśników. Jawne powiązania umożliwiają rozpoznanie także konfliktu pośredniego. Reguły zamian mleka mają stabilne identyfikatory, ustaloną kolejność, proporcję objętościową i konkretne zmiany instrukcji ograniczone do kontekstu naleśników oraz zgodnego, wersjonowanego szablonu przepisu odniesienia.

Lokalne polecenia i CI wykrywają uszkodzoną strukturę katalogu, niejednoznaczne aliasy, błędne odwołania, cykle i niepełne aktywne reguły. Osobny pakiet przykładów definiuje oczekiwane zachowanie przyszłego walidatora. Użytkownik przegląda dane oraz przykłady i potwierdza odbiór w zapisie związanym z ich konkretną wersją i skrótami SHA-256. Dopiero ten odbiór wraz z kontrolami automatycznymi domyka F-01.

### Key Discoveries:

- `context/foundation/roadmap.md:80` — F-01 obejmuje katalog i przykłady; wykonanie reguł należy do następnych slices.
- `context/foundation/prd.md:46` — US-01 wymaga naleśników z mlekiem i przynajmniej jednej dozwolonej zamiany.
- `context/foundation/prd.md:99` — twórca ustala powiązania i kolejność zamienników; proporcja i reguła instrukcji są wymagane.
- `src/lib/config-status.ts:3` — istnieje wzorzec jawnych interfejsów TypeScript i danych w repozytorium.
- `tsconfig.json:2` — obowiązuje konfiguracja Astro strict oraz alias `@/*`.
- `package.json:5` i `scripts/smoke.mjs:38` — brak testów katalogu; istniejący smoke dotyczy auth.
- `.github/workflows/ci.yml:18` — CI ma już install/sync/lint/check/build, bez kontroli danych domenowych.
- `scripts/deploy-manifest.mjs:27` — manifest wdrożenia obejmuje src, scripts, konfigurację i CI; ich zmiana unieważni zapisany odbiór źródeł stagingu.

## What We're NOT Doing

- Ekrany i zapis wykluczeń, tabele danych użytkowników, RLS i endpointy produktu — zakres S-01 i późniejszych slices.
- Integracja AI, rozpoznawanie wejścia w żądaniu użytkownika, wykonywanie zamian i walidacja wygenerowanego przepisu — zakres S-02.
- Zapis i otwieranie przepisów, odzyskiwanie hasła, SMTP, wdrożenie albo aktualizacja zależności.
- Reguły dla zup, ciast, innych potraw i dowolnych zastosowań mleka; zamiany pszenicy, orzechów włoskich i grochu nie są wymagane do ukończenia F-01.
- Rozpoznawanie przez podobieństwo, zgadywanie znaczenia nazwy „mleko”, dopisywanie własnych nazw przez użytkownika i automatyczne uzupełnianie katalogu przez AI.
- Konwersje g ↔ ml, miary domowe, zamiany wieloskładnikowe, kolejne rundy zamian i dowolne przeredagowywanie instrukcji.
- Próba kuchenna jako warunek odbioru. Użytkownik wybrał przegląd danych i przykładów.
- Pełna baza marek, analiza etykiet i śladowych zanieczyszczeń. Wpis oznacza konkretny opisany profil katalogowy; nie rozszerzamy jego znaczenia na wszystkie produkty o podobnej nazwie.

## Implementation Approach

Źródłem prawdy jest JSON przechowywany w src/data, objęty przeglądem zmian. Kontrakt TypeScript opisuje jego kształt dla kolejnych funkcji, a data-contract.ts wiąże rzeczywiste importy JSON z tymi typami podczas kontroli projektu. Kontrola w skryptach Node czyta te same pliki bez sieci, Supabase, sekretów i dodatkowych zależności. JSON jest zaufanym źródłem repozytoryjnym dopuszczanym przez kontrole CI; nie tworzymy tu parsera dowolnych danych użytkownika.

Przyjęte decyzje użytkownika:

- Konflikt wynika z dowolnego jawnego łańcucha contains, np. napój grochowy → białko grochu → groch. Nie trzeba powielać ostatniej relacji przy każdym produkcie; cykle są błędem katalogu.
- Agent przygotowuje konkretny przepis, katalog i kolejność zamienników, a użytkownik odbiera je podczas implementacji.
- Reguły zamian obowiązują wyłącznie w kontekście `crepes`; inne konteksty nie dziedziczą ich automatycznie.
- Rozpoznawane są tylko jednoznaczne nazwy i jawne aliasy; „mleko” nie jest aliasem mleka krowiego.
- Odbiór obejmuje przegląd produktów, powiązań, kolejności, proporcji, instrukcji i oczekiwanych wyników przykładów, bez wymaganej próby kuchennej.

### Zakres danych v1

Proponowany zestaw roboczy ma 12 produktów: `cow-milk`, `wheat`, `walnut`, `pea`, `wheat-flour`, `hen-egg`, `rapeseed-oil`, `water`, `oat`, `pea-protein`, `pea-drink-unsweetened`, `oat-drink-unsweetened`. Wybieralne wykluczenia to dokładnie cztery pierwsze identyfikatory. Dodanie owsa do produktów nie dodaje nowego wybieralnego wykluczenia.

Jawne relacje obejmują co najmniej wheat-flour → wheat, pea-protein → pea oraz pea-drink-unsweetened → pea-protein; profil napoju owsianego zawiera owies. Wpisy napojów muszą określać swój profil i dowód przeglądu pod kątem czterech wykluczeń. Brak relacji oznacza brak danego powiązania w sprawdzonym zakresie katalogu, a nie domysł na podstawie kategorii produktu.

Roboczy przepis `crepes-basic-v1` to naleśniki bez nadzienia: 120 g mąki pszennej, 360 ml mleka krowiego, 2 jajka i 15 ml oleju rzepakowego do natłuszczania patelni. To propozycja metryczna agenta inspirowana przepisem University of Maine, do odbioru przez twórcę; nie deklarujemy potwierdzonej liczby porcji. Wszystkie użyte składniki, również wymienione w krokach, muszą występować na liście składników.

Kolejność kandydatów do zamiany mleka: najpierw opisany niesłodzony napój grochowy, następnie opisany niesłodzony napój owsiany. Obie reguły mają proporcję 1 ml → 1 ml w kontekście crepes. Kolejność jest propozycją autora danych, a nie rankingiem właściwości zdrowotnych. Umożliwia też rzeczywisty przypadek pominięcia pierwszego kandydata przy wykluczeniu grochu.

Instrukcje przepisu mają stabilne identyfikatory. Każda reguła jawnie dodaje krok przygotowania napoju przed mieszaniem płynów i zastępuje krok mieszania tekstem z identyfikatorem oraz ilością zamiennika. Pozostałe kroki są zachowane. Nie zastępujemy słów globalnie w swobodnym tekście i nie pozostawiamy wzmianki o mleku krowim po zamianie.

Po review przyjęto wariant A dla F2: reguły są związane z szablonem `crepes-basic`, templateVersion=1, utrwalonym w referenceRecipe. Sama deklaracja context=crepes ani skopiowanie id szablonu nie wystarcza. Wejściowe kroki muszą mieć unikalne id, tę samą kolejność, treść instrukcji i odwołania do składników co szablon odniesienia; pola ilości są parametrami danych, a nie swobodnymi zmianami treści kroków. Brak kotwicy, zdublowane id albo zmiana znaczenia kroku powoduje niedostępność reguły. Wszystkich kandydatów obowiązuje ten sam warunek; gdy konflikt pozostaje i nie ma dostępnej reguły, oczekiwanym wynikiem jest odrzucenie przepisu. S-02 będzie musiało generować wejście zgodne z tym szablonem lub obsłużyć taką odmowę; F-01 definiuje kontrakt i przykłady, bez kodu jego wykonania.

## Critical Implementation Details

### Granica kontroli danych

Kontrola katalogu może sprawdzać graf, odwołania i kompletność oczekiwanych wyników, ale nie wykonuje przepisu ani doboru zamienników. Przykłady „odrzuć” są zapisanym kontraktem i przedmiotem ręcznego odbioru; dopiero S-02 porówna je z działającym silnikiem walidacji. Ujemne testy uszkodzonego katalogu nie mogą trafić do aktywnych danych aplikacji.

### Manifest wdrożenia

Nowe źródła i zmiany CI unieważnią obecny source-manifest.sha256. F-01 nie odświeża tego historycznego potwierdzenia i nie publikuje aplikacji; kolejna publikacja wymaga ponownego odbioru stagingu zgodnie z istniejącym deploy-plan.md.

## Phase 1: Kontrakt i dane katalogu

### Overview

Utworzyć minimalny, wersjonowany zbiór danych oraz jawny kontrakt dla jego przyszłych odbiorców. Dane pozostają propozycją do ręcznego odbioru w fazie 3.

### Changes Required:

#### 1. Publiczny kontrakt danych

**Files**: `src/lib/catalog/types.ts`, `src/lib/catalog/data-contract.ts`

**Intent**: Nazwać wspólne pojęcia katalogu, aby kolejne slices korzystały z tego samego modelu.

**Contract**: Eksportowane typy `CatalogData`, `CatalogProduct`, `CatalogSubstitution`, `CatalogRecipe` i `CatalogCase`. Katalog zawiera schemaVersion, catalogVersion, selectableExclusionIds, products, substitutions i referenceRecipe; identyfikatory są stabilnymi slugami. Produkt ma id, name, aliases, contains oraz opis profilu/źródła przeglądu. Reguła ma id, sourceProductId, targetProductId, context, appliesTo, priority, quantity i instructionChanges; appliesTo zawiera templateId i templateVersion. Przepis ma id, context, templateId, templateVersion, ingredients oraz steps ze stabilnymi id. Bez funkcji runtime i integracji auth.

data-contract.ts importuje rzeczywisty meal-catalog.v1.json i sprawdza jego zgodność z CatalogData przez przypisanie typowane lub satisfies, bez rzutowań as, any, podwójnego rzutowania przez unknown ani wyłączeń diagnostyki. Nie odtwarza struktury JSON w ręcznie przepisanym obiekcie. W fazie 2 ten sam plik obejmie rzeczywisty meal-catalog-cases.v1.json i typy przypadków, z jawną reprezentacją nieznanego składnika oraz test-only overlay. Typy na granicy JSON muszą umożliwiać taką kontrolę bez maskowania diagnostyki; ograniczenia wartości, których import JSON nie zachowuje jako typów literalnych, sprawdza kontrola integralności. Kryterium 1.2 obejmuje ten rzeczywisty import katalogu, a kryterium 2.3 — oba pliki danych.

#### 2. Dane katalogu i przepis odniesienia

**File**: `src/data/meal-catalog.v1.json`

**Intent**: Zapisać zaproponowane produkty, powiązania i zamiany oraz konkretny przepis, który pozwoli później odebrać US-01.

**Contract**: schemaVersion=1, catalogVersion=1, zestaw i przepis zgodne z „Zakres danych v1”. contains to skierowane odwołania do produktów; dokładna tożsamość produktu także powoduje konflikt z tym samym wykluczeniem. Niższa dodatnia priority oznacza wcześniejszego kandydata i jest unikalna w parze sourceProductId/context. quantity określa dodatnie fromAmount/toAmount oraz fromUnit/toUnit; aktywne reguły v1 dopuszczają wyłącznie ml → ml i 1:1. InstructionChanges zawierają uporządkowane operacje insert-before/replace odnoszące się do id kroku i jawnych parametrów produktu/ilości; pola nie mogą być puste. Kontekst crepes jest jedynym kontekstem reguł; dostępność wymaga również zgodnego appliesTo i struktury wejściowych kroków. Obie reguły wskazują appliesTo.templateId=crepes-basic i appliesTo.templateVersion=1, zgodne z referenceRecipe.templateId/templateVersion. Wersja szablonu jest niezależna od catalogVersion; zmiana struktury lub znaczenia kroków wymaga nowej templateVersion i ponownego przeglądu reguł.

Nazwy i aliasy są porównywane po NFC, usunięciu skrajnych i zwielokrotnionych odstępów oraz zamianie liter na małe, z zachowaniem polskich znaków. Ten sam wynik normalizacji nie może wskazywać różnych produktów. Nie stosujemy dopasowania częściowego ani automatycznego uznania niejednoznacznej nazwy za produkt.

### Success Criteria:

#### Automated Verification:

- Plik meal-catalog.v1.json jest poprawnym JSON: `node -e 'JSON.parse(require("node:fs").readFileSync("src/data/meal-catalog.v1.json", "utf8"))'`.
- Kontrakt TypeScript przechodzi kontrolę projektu: `npx --no-install astro check`.
- Zmiany fazy przechodzą lint: `npm run lint`.

## Phase 2: Kontrole i przykłady odbioru

### Overview

Zabezpieczyć spójność danych i przygotować konkretne oczekiwania dla przyszłego silnika walidacji, bez implementowania tego silnika.

### Changes Required:

#### 1. Przykłady zgodności i odmowy

**Files**: `src/data/meal-catalog-cases.v1.json`, `src/lib/catalog/data-contract.ts`

**Intent**: Zamienić wymagania PRD i ustalenia rozmowy na powtarzalne przykłady wejścia oraz oczekiwanego wyniku do odbioru i późniejszych testów S-02/S-04.

**Contract**: Każdy przypadek ma stabilne id, caseKind, catalogVersion, recipe, exclusionIds i expected z wynikiem, przyczyną, ścieżkami konfliktu oraz — przy zamianie — regułami i pełnym przepisem wynikowym. Nieznany składnik jest jawną nazwą bez przypisanego id, a nie udawanym poprawnym odwołaniem. Przypadki z niepełną regułą stosują jawny test-only overlay usuwający wymagane pole; nie modyfikują katalogu bazowego.

Obowiązkowe przykłady:

- Zgodne naleśniki bez wykluczeń zachowują wszystkie składniki i kroki.
- US-01: wykluczone cow-milk; 360 ml mleka przechodzi na 360 ml napoju grochowego, a wynikowe kroki odnoszą się do zamiennika.
- Wykluczone cow-milk i pea: odrzucenie pierwszego kandydata przez pea-drink-unsweetened → pea-protein → pea; wybór 360 ml napoju owsianego.
- Konflikt bez zamiany: wheat-flour → wheat przy wykluczeniu pszenicy odrzuca przepis.
- Bezpośredni konflikt z orzechem włoskim w wariancie przepisu odrzuca go; groch jako produkt konfliktuje z wykluczeniem pea.
- Nierozpoznany składnik oraz niejednoznaczne „mleko” osobno odrzucają cały przepis.
- Brak proporcji oraz brak instrukcji osobno wyłączają regułę; gdy nie ma innej kompletnej dozwolonej reguły, przepis jest odrzucony. Overlay obejmuje wszystkich kandydatów, aby oczekiwanie odmowy nie pomijało poprawnego fallbacku.
- Reguła crepes nie jest dostępna dla innego kontekstu; gramowa ilość mleka nie dostaje automatycznej konwersji na ml.
- Niezgodny szablon w tym samym kontekście crepes: inny templateId lub templateVersion, brak kotwicy, powtórzone id oraz zmieniona treść kroku mimo tych samych id są osobnymi wariantami. Dla wykluczonego cow-milk obie reguły są niedostępne, a przepis zostaje odrzucony bez częściowej zmiany instrukcji. Powtórzone id są celowym błędem wejścia przykładu, nie szablonu bazowego.
- Pełna ponowna walidacja: wariant z mlekiem i mąką przy wykluczeniach cow-milk/wheat pozostaje odrzucony mimo możliwej zamiany mleka.

Warianty pozostają kompletnymi przepisami ze zgodnymi listami składników i krokami. Oczekiwania odnoszą się wyłącznie do katalogu i kontekstu danej wersji; nie definiują nowych wybieralnych wykluczeń.

#### 2. Kontrola integralności i polecenie lokalne

**Files**: `scripts/lib/meal-catalog-check.mjs`, `scripts/check-meal-catalog.mjs`

**Intent**: Odrzucać niespójne dane zanim staną się podstawą funkcji produktu, korzystając z istniejącego wzorca skryptów Node bez dodatkowych pakietów.

**Contract**: Czysta funkcja `checkCatalog(catalog, cases)` zwraca listę diagnostyk z code, path i message; moduł nie czyta plików i nie modyfikuje argumentów. CLI czyta oba pliki v1, wypisuje liczbę produktów/reguł/przykładów, a błąd parsowania albo dowolna diagnostyka kończy się exit 1. Sukces kończy się exit 0. Brak sieci, sekretów i zależności od bieżącego katalogu uruchomienia.

Kontrola obejmuje wersje i wymagane pola, dokładny zestaw czterech wykluczeń, unikalne id, normalizację i jednoznaczność nazw, wszystkie odwołania contains, brak cykli, priorytety kandydatów, dodatnie proporcje i obsługiwane jednostki, kompletność aktywnych instrukcji, zgodność appliesTo z wersjonowanym szablonem odniesienia, unikalność id jego kroków, powiązanie operacji z krokami przepisu, identyfikatory produktów w przepisach oraz obecność wymaganych caseKind i kształt oczekiwanych wyników. Nie wymaga nieobecności składnika konfliktowego w przepisie wejściowym, gdy konflikt stanowi sens przykładu. Test-only overlay nie jest walidowany jako aktywna reguła bazowa; musi mieć jawnie oznaczone oczekiwanie odmowy lub niedostępności. Przypadki niezgodnego szablonu mogą celowo mieć błędne id lub strukturę wejściowych kroków, muszą jednak jawnie wskazywać rodzaj niezgodności i oczekiwaną odmowę; nie zwalnia to bazowego szablonu z kontroli integralności. Kontrola danych nie wykonuje aplikowania reguł do tych przykładów.

#### 3. Testy kontroli danych

**File**: `scripts/check-meal-catalog.test.mjs`

**Intent**: Sprawdzić, że kontrola wykrywa błędy, których nie wykryje sam lint lub TypeScript.

**Contract**: Testy natywnego `node:test` importują czystą funkcję i korzystają z kopii rzeczywistych danych oraz małych, jawnie błędnych wariantów. Obejmują poprawny katalog, brak odwołania, cykl, konflikt aliasów po normalizacji, puste/niepełne reguły, niedodatnie ilości, zdublowany priorytet, brak produktu w przepisie, błędny id kroku i brak wymaganego rodzaju przykładu. Poprawny łańcuch wielopoziomowy nie jest cyklem. Test CLI potwierdza exit 1 dla błędnego wejścia bez zmiany źródłowego katalogu; implementer może wydzielić obsługę wejścia lub użyć tymczasowych plików testowych.

Kryterium 2.2 obejmuje także testy błędnego appliesTo, powtórzonych id kroków w szablonie bazowym oraz brakujących wariantów odmowy dla niezgodnego szablonu. Testy zgodności typów korzystają z zainstalowanego kompilatora TypeScript i rzeczywistych importów w data-contract.ts: poprawne oba JSON przechodzą kontrolę, a usunięcie wymaganego pola osobno w katalogu i w przypadku odbioru wywołuje diagnostykę zgodności z publicznym typem. Używać kopii w pamięci lub izolowanego katalogu tymczasowego bez zmiany źródłowych JSON; test ma wykrywać błąd struktury, a nie brak pliku/importu. Nie wprowadzamy nowej biblioteki ani runtime silnika produktu.

### Success Criteria:

#### Automated Verification:

- Katalog i komplet przykładów przechodzą kontrolę: `node scripts/check-meal-catalog.mjs`.
- Testy poprawnych i celowo błędnych danych przechodzą: `node --test scripts/check-meal-catalog.test.mjs`.
- Kod i kontrakty fazy przechodzą lint oraz kontrolę typów: `npm run lint` i `npx --no-install astro check`.

## Phase 3: CI i ręczny odbiór

### Overview

Włączyć stałą kontrolę katalogu, opisać jego kontrakt i uzyskać konkretny odbiór danych oraz przykładów przez właściciela produktu.

### Changes Required:

#### 1. Polecenia i CI

**Files**: `package.json`, `.github/workflows/ci.yml`

**Intent**: Zapewnić łatwe lokalne uruchamianie kontroli i blokować niespójne dane w istniejącym jobie ci.

**Contract**: `check:catalog` uruchamia CLI, a `test:catalog` natywny test Node. Job ci wykonuje oba polecenia po npm ci i przed buildem, na wersji Node z .nvmrc. Pozostałe kontrole i job smoke zachowują dotychczasowe przeznaczenie. Nie dodajemy bibliotek ani zmian package-lock.json, bo zmiana samych scripts ich nie wymaga.

#### 2. Kontrakt i instrukcja przeglądu

**Files**: `docs/catalog/README.md`, `README.md`

**Intent**: Wyjaśnić przyszłym implementerom, co oznaczają dane, jak je zmieniać i w jaki sposób przyjąć lub odrzucić ich treść.

**Contract**: Dokumentacja katalogu opisuje identyfikatory, wersjonowanie, pola, pełny łańcuch contains, reguły nazw, kierunek proporcji, kontekst crepes, operacje na krokach, listę przykładów oraz granicę między kontrolą integralności a wykonaniem reguł w S-02. Zawiera źródła kulinarne z datą odczytu i rozróżnia propozycję danych od potwierdzonego odbioru. README projektu dodaje polecenia i odsyłacz do docs/catalog/README.md bez przepisywania niezwiązanych sekcji.

Dokumentacja wyjaśnia również rolę data-contract.ts i warunek appliesTo wraz z porównaniem struktury wejściowych kroków. Jawnie wskazuje konsekwencję dla S-02: ten katalog obsługuje zamianę tylko przy zgodnym szablonie crepes-basic w wersji 1; inna struktura naleśników może zostać odrzucona. Nie mapujemy automatycznie kroków po podobieństwie ani nie wprowadzamy systemu semantycznych ról kroków w tym zakresie.

Zmiana treści katalogu lub przykładów zwiększa catalogVersion i aktualizuje odpowiadające wersje przypadków; nie usuwa ani nie wykorzystuje ponownie istniejących id. Zmiana kształtu kontraktu wymaga osobnej schemaVersion i jawnego dostosowania konsumentów. Sam odbiór nie zmienia treści JSON, dzięki czemu jego skróty pozostają stabilne.

#### 3. Zapis ręcznego odbioru

**File**: `context/changes/verified-first-meal-catalog/catalog-review.md`

**Intent**: Powiązać rzeczywisty przegląd twórcy z konkretnymi danymi, zamiast wyprowadzać zatwierdzenie z samego sukcesu skryptu.

**Contract**: Zapis zawiera catalogVersion, skróty SHA-256 obu JSON, datę, osobę dokonującą odbioru, wynik kontroli automatycznych, wynik przeglądu produktów/powiązań/reguł i wynik przeglądu przypadków z ich id. Początkowo wynik jest oczekujący; pozytywny odbiór i tożsamość recenzenta zapisujemy dopiero po odpowiedzi użytkownika dotyczącej pokazanych danych. Korekta JSON unieważnia wcześniejszy odbiór i wymaga kontroli oraz ponownego przeglądu zmienionej wersji. Dokument nie duplikuje stanu wykonania z Progress.

### Success Criteria:

#### Automated Verification:

- Polecenia docelowe przechodzą: `npm run check:catalog` i `npm run test:catalog`.
- Końcowe kontrole projektu przechodzą na Node 22.23.3: `npx --no-install astro sync`, `npm run lint`, `npx --no-install astro check` i `npm run build`.
- Plik CI zawiera obie kontrole przed buildem, dokumentacja wskazuje istniejące pliki i polecenia, a skróty danych w zapisie odbioru odpowiadają bieżącym JSON; weryfikacja lokalna bez publikacji i bez odświeżania manifestu stagingu.

#### Manual Verification:

- Twórca zatwierdził produkty, pełne powiązania, kolejność napój grochowy → owsiany, proporcje 1:1 i instrukcje w kontekście naleśników; potwierdzenie zapisano dla bieżących skrótów danych.
- Twórca zatwierdził oczekiwane wyniki wszystkich przykładów, w tym pominięcie napoju grochowego, odmowy i brak domyślnego znaczenia „mleko”; potwierdzenie zapisano w catalog-review.md.

**Implementation Note**: Po kontrolach automatycznych pokazać użytkownikowi konkretne dane, różnice instrukcji i wyniki przykładów. Zatrzymać domknięcie F-01 do potwierdzenia powyższych dwóch punktów; nie oznaczać ich jako wykonanych na podstawie zatwierdzenia niniejszego planu.

## Testing Strategy

### Unit Tests:

Testujemy integralność danych za pomocą natywnego Node, bez nowego frameworka. Testy ujemne mają potwierdzać konkretną diagnostykę i odrzucenie błędów; nie są kopią implementacji wyboru zamiennika. Wartości wejściowe i oczekiwane pozostają czytelne dla człowieka.

Osobny zakres istniejącego testu katalogu dowodzi powiązania danych z typami: kompilacja rzeczywistych importów musi rozróżniać poprawne JSON od kopii pozbawionych wymaganego pola. Testy appliesTo dotyczą integralności danych reguły i kompletności przykładów; wykonywanie odmowy przy niezgodnej strukturze pozostaje przyszłym testem silnika S-02.

### Integration Tests:

CLI ładuje rzeczywisty katalog i przykłady, zgłasza ich niespójność właściwym exit code i jest uruchamiane w CI. Katalog nie wymaga Supabase ani połączeń zewnętrznych. Nie uruchamiamy zdalnego auth smoke tylko dla dodania danych; istniejący job zachowuje się jak wcześniej. Wykonanie przykładów przez rzeczywisty silnik produktu jest przyszłym odbiorem S-02, nie wynikiem tych testów.

### Manual Testing Steps:

1. Przejrzeć wszystkie produkty i znaczenie braku/presencji relacji dla czterech wspieranych wykluczeń; potwierdzić pełny łańcuch napój → białko grochu → groch.
2. Przejrzeć przepis bazowy, ilości, kroki i oba warianty po zamianie; potwierdzić, że 360 ml przechodzi na 360 ml oraz że instrukcje wskazują właściwy produkt.
3. Przejść po przykładach: milk-only wybiera napój grochowy, milk+pea wybiera owsiany, konflikt pszenicy nadal odrzuca całość, a „mleko” nie jest rozpoznawane.
4. Zweryfikować odmowy przy nieznanym składniku, niepełnych regułach, innym kontekście, niezgodnym szablonie w kontekście crepes i nieobsługiwanej jednostce; zapisać odbiór z bieżącymi skrótami danych.

## Performance Considerations

Katalog v1 jest mały i lokalny. Kontrola grafu musi kończyć się także przy cyklu i nie powinna wielokrotnie rozwijać tych samych podgrafów; nie wprowadzamy cache sieciowego ani benchmarków. Nie deklarujemy czasu CPU walidacji w Workerze — pomiar pełnego przepływu pozostaje zadaniem S-02.

## Migration Notes

Nie ma migracji bazy ani danych użytkownika. Pierwsza wersja ustanawia stabilne id dla późniejszych zapisów wykluczeń; odbiorcy nie powinni przechowywać nazwy jako tożsamości produktu. Katalog i odpowiadające przykłady są zmieniane razem. Zmiana może zostać cofnięta jako zmiana źródeł, a przyszłe usuwanie lub zmiana znaczenia id wymaga osobnego planu zgodności konsumentów.

Stary manifest wdrożenia pozostaje zapisem wcześniej odebranego startera. Przed następną publikacją trzeba wykonać procedurę ponownego builda i odbioru stagingu; jego niezgodność po F-01 jest oczekiwaną informacją o zmianie źródeł. Nie wykonujemy commit/push w ramach pisania planu. Przy implementacji nie obejmować szerokim git add wszystkich nieśledzonych plików projektu; brak bazowego commitu może wymagać osobnego uporządkowania pierwszego commitu.

## References

- Tożsamość zmiany: `context/changes/verified-first-meal-catalog/change.md`.
- Zakres i zależności: `context/foundation/roadmap.md` — F-01, S-01, S-02, S-04.
- Reguły produktu: `context/foundation/prd.md` — FR-003, FR-005, US-01, Business Logic.
- Przyjęte decyzje: `context/foundation/shape-notes.md`; pięć odpowiedzi użytkownika w bieżącej sesji i zatwierdzenie trzech faz.
- Technologia i wdrożenie: `context/foundation/tech-stack.md`, `context/foundation/infrastructure.md`, `context/deployment/deploy-plan.md`.
- Wzorce kodu: `src/lib/config-status.ts:3`, `tsconfig.json:2`, `eslint.config.js:73`, `scripts/deploy-manifest.mjs:27`, `.github/workflows/ci.yml:18`.
- [University of Maine — Crêpes](https://extension.umaine.edu/food-health/recipes/crepes/) — odczyt 2026-10-18; punkt odniesienia dla prostych naleśników i użycia napojów roślinnych. Metryczne ilości w tym planie są roboczą adaptacją agenta.
- [King Arthur Baking — How to bake dairy-free](https://www.kingarthurbaking.com/blog/2018/05/10/how-to-bake-dairy-free) — odczyt 2026-10-18; pomocnicze uzasadnienie proporcji 1:1 dla niesłodzonych, neutralnych napojów roślinnych; zakres planu pozostaje ograniczony do naleśników.

## Progress

### Phase 1: Kontrakt i dane katalogu

#### Automated

- [x] 1.1 Plik meal-catalog.v1.json jest poprawnym JSON: `node -e 'JSON.parse(require("node:fs").readFileSync("src/data/meal-catalog.v1.json", "utf8"))'`. — 5cba13e
- [x] 1.2 Kontrakt TypeScript przechodzi kontrolę projektu: `npx --no-install astro check`. — 5cba13e
- [x] 1.3 Zmiany fazy przechodzą lint: `npm run lint`. — 5cba13e

### Phase 2: Kontrole i przykłady odbioru

#### Automated

- [x] 2.1 Katalog i komplet przykładów przechodzą kontrolę: `node scripts/check-meal-catalog.mjs`. — 9c5eb08
- [x] 2.2 Testy poprawnych i celowo błędnych danych przechodzą: `node --test scripts/check-meal-catalog.test.mjs`. — 9c5eb08
- [x] 2.3 Kod i kontrakty fazy przechodzą lint oraz kontrolę typów: `npm run lint` i `npx --no-install astro check`. — 9c5eb08

### Phase 3: CI i ręczny odbiór

#### Automated

- [x] 3.1 Polecenia docelowe przechodzą: `npm run check:catalog` i `npm run test:catalog`. — dfe6114
- [x] 3.2 Końcowe kontrole projektu przechodzą na Node 22.23.3: `npx --no-install astro sync`, `npm run lint`, `npx --no-install astro check` i `npm run build`. — dfe6114
- [x] 3.3 Plik CI zawiera obie kontrole przed buildem, dokumentacja wskazuje istniejące pliki i polecenia, a skróty danych w zapisie odbioru odpowiadają bieżącym JSON; weryfikacja lokalna bez publikacji i bez odświeżania manifestu stagingu. — dfe6114

#### Manual

- [x] 3.4 Twórca zatwierdził produkty, pełne powiązania, kolejność napój grochowy → owsiany, proporcje 1:1 i instrukcje w kontekście naleśników; potwierdzenie zapisano dla bieżących skrótów danych. — dfe6114
- [x] 3.5 Twórca zatwierdził oczekiwane wyniki wszystkich przykładów, w tym pominięcie napoju grochowego, odmowy i brak domyślnego znaczenia „mleko”; potwierdzenie zapisano w catalog-review.md. — dfe6114
