# Katalog posiłków v1

Wersjonowany, repozytoryjny katalog produktów i reguł zamian dla pierwszego posiłku MealAdapt (F-01): naleśniki z mlekiem krowim i jego zamiana na napój roślinny. Katalog dostarcza dane i oczekiwania dla kolejnych funkcji (S-01, S-02, S-04); sam nie wykonuje zamian.

> **Status treści:** dane i przykłady są **propozycją** przygotowaną przez agenta. Pola `review.status` mają wartość `pending`. Treść uznaje się za potwierdzoną dopiero po ręcznym odbiorze właściciela produktu, zapisanym w [catalog-review.md](../../context/changes/verified-first-meal-catalog/catalog-review.md) dla konkretnej `catalogVersion` i skrótów SHA-256 obu plików JSON. Sukces kontroli automatycznych nie jest odbiorem.

## Pliki

| Plik                                                                               | Rola                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/data/meal-catalog.v1.json`](../../src/data/meal-catalog.v1.json)             | Źródło prawdy: produkty, wybieralne wykluczenia, reguły zamian, przepis odniesienia.                                                                                                                |
| [`src/data/meal-catalog-cases.v1.json`](../../src/data/meal-catalog-cases.v1.json) | Przykłady odbioru: wejście i oczekiwany wynik przyszłego walidatora.                                                                                                                                |
| [`src/lib/catalog/types.ts`](../../src/lib/catalog/types.ts)                       | Publiczny kontrakt TypeScript (`CatalogData`, `CatalogProduct`, `CatalogSubstitution`, `CatalogRecipe`, `CatalogCase`, `CatalogCaseSet` i typy pomocnicze).                                         |
| [`src/lib/catalog/data-contract.ts`](../../src/lib/catalog/data-contract.ts)       | Wiąże rzeczywiste importy obu JSON z typami (`mealCatalog: CatalogData`, `mealCatalogCases: CatalogCaseSet`) bez rzutowań `as`/`any`. Usunięcie wymaganego pola z JSON powoduje błąd `astro check`. |
| [`scripts/lib/meal-catalog-check.mjs`](../../scripts/lib/meal-catalog-check.mjs)   | Czysta funkcja `checkCatalog(catalog, cases)` zwracająca diagnostyki `{ code, path, message }`.                                                                                                     |
| [`scripts/check-meal-catalog.mjs`](../../scripts/check-meal-catalog.mjs)           | CLI: czyta oba pliki v1, wypisuje liczniki, exit 1 przy błędzie parsowania lub diagnostyce.                                                                                                         |
| [`scripts/check-meal-catalog.test.mjs`](../../scripts/check-meal-catalog.test.mjs) | Testy `node:test` poprawnych i celowo błędnych danych oraz powiązania JSON z typami.                                                                                                                |

## Polecenia

```bash
npm run check:catalog   # node scripts/check-meal-catalog.mjs
npm run test:catalog    # node --test scripts/check-meal-catalog.test.mjs
```

Oba polecenia działają bez sieci, Supabase i sekretów. Job `ci` w [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) uruchamia je po `npm ci`, a przed `astro sync`, lintem, `astro check` i buildem.

## Identyfikatory

Wszystkie id są stabilnymi slugami (`a-z`, `0-9`, myślnik). Odbiorcy przechowują id, nigdy nazwę, jako tożsamość produktu. Istniejących id nie usuwa się ani nie wykorzystuje ponownie z innym znaczeniem; zmiana znaczenia id wymaga osobnego planu zgodności konsumentów.

## Pola katalogu (`CatalogData`)

- `schemaVersion` — wersja kształtu kontraktu (obecnie 1).
- `catalogVersion` — wersja treści katalogu i przykładów (obecnie 1).
- `selectableExclusionIds` — dokładnie cztery wybieralne wykluczenia: `cow-milk`, `wheat`, `walnut`, `pea`. Obecność innych produktów (np. `oat`) nie dodaje wykluczeń.
- `products[]` — `id`, `name`, `aliases`, `contains`, `profile.description` i `profile.review` (`status`, `basis`, `exclusionIds` objęte przeglądem, `sources`).
- `substitutions[]` — `id`, `sourceProductId`, `targetProductId`, `context`, `appliesTo` (`templateId`, `templateVersion`), `priority`, `quantity` (`fromAmount`, `fromUnit`, `toAmount`, `toUnit`), `instructionChanges[]`.
- `referenceRecipe` — przepis odniesienia: `id`, `context`, `templateId`, `templateVersion`, `ingredients[]`, `steps[]`.
- `referenceRecipeReview` — status, uzasadnienie i źródła przepisu oraz reguł.

Typy na granicy JSON używają `string`/`number`, bo import JSON nie zachowuje typów literalnych. Zamknięte zbiory wartości (jednostki, operacje, konteksty, wyniki, przyczyny) sprawdza kontrola integralności.

## Produkty i łańcuch `contains`

Katalog v1 ma 12 produktów: `cow-milk`, `wheat`, `walnut`, `pea`, `wheat-flour`, `hen-egg`, `rapeseed-oil`, `water`, `oat`, `pea-protein`, `pea-drink-unsweetened`, `oat-drink-unsweetened`.

`contains` to skierowane krawędzie „produkt zawiera produkt”. Konflikt z wykluczeniem powstaje, gdy produkt **jest** wykluczonym produktem albo gdy istnieje **dowolny** jawny łańcuch `contains` prowadzący do niego. Ostatniej relacji nie powiela się przy każdym produkcie:

```
wheat-flour → wheat
pea-drink-unsweetened → pea-protein → pea
pea-drink-unsweetened → water, rapeseed-oil
oat-drink-unsweetened → water, oat, rapeseed-oil
```

Cykle są błędem katalogu; poprawny łańcuch wielopoziomowy nie jest cyklem. **Brak relacji** oznacza brak danego powiązania w sprawdzonym zakresie zamkniętego profilu katalogowego, a nie domysł z kategorii produktu, analizę etykiet, marek czy śladowych zanieczyszczeń. Napoje są modelowymi profilami („niesłodzony, neutralny napój z…”), a nie dowolnym produktem handlowym o podobnej nazwie.

## Reguły nazw

Nazwy i aliasy porównuje się po normalizacji: Unicode NFC, usunięcie skrajnych i zwielokrotnionych odstępów, małe litery z zachowaniem polskich znaków. Ten sam wynik normalizacji nie może wskazywać różnych produktów. Nie ma dopasowania częściowego ani podobieństwa. Rozpoznawane są tylko jednoznaczne nazwy i jawne aliasy — **„mleko” nie jest aliasem `cow-milk`** i pozostaje nierozpoznane.

## Reguły zamian

Dwie reguły dla `cow-milk` w kontekście `crepes`:

| priority | id                                            | cel                     |
| -------- | --------------------------------------------- | ----------------------- |
| 1        | `cow-milk-to-pea-drink-unsweetened-crepes-v1` | `pea-drink-unsweetened` |
| 2        | `cow-milk-to-oat-drink-unsweetened-crepes-v1` | `oat-drink-unsweetened` |

- **Kolejność:** niższa dodatnia `priority` oznacza wcześniejszego kandydata; jest unikalna w parze `sourceProductId`/`context`. Wybierany jest pierwszy dozwolony kandydat. Kolejność jest propozycją autora danych, a nie rankingiem zdrowotnym; umożliwia przypadek pominięcia napoju grochowego przy wykluczeniu `pea`.
- **Proporcja i jej kierunek:** `fromAmount fromUnit` składnika źródłowego przechodzi na `toAmount toUnit` zamiennika. Aktywne reguły v1 dopuszczają wyłącznie `ml → ml` w proporcji 1:1 (360 ml mleka → 360 ml napoju). Nie ma konwersji g ↔ ml ani miar domowych; mleko podane w gramach nie kwalifikuje się do zamiany.
- **Kontekst:** reguły obowiązują wyłącznie w kontekście `crepes` (jedyny obsługiwany kontekst v1). Inne konteksty, np. `pancakes`, nie dziedziczą ich automatycznie.
- **Kompletność:** reguła bez `quantity` lub bez `instructionChanges` jest niedostępna.

### `appliesTo` i struktura kroków

Obie reguły mają `appliesTo = { templateId: "crepes-basic", templateVersion: 1 }`, zgodne z `referenceRecipe`. Reguła jest dostępna tylko, gdy przepis wejściowy:

1. ma `context = crepes` oraz te same `templateId` i `templateVersion`,
2. ma kroki o unikalnych id, w tej samej kolejności, z tą samą treścią instrukcji i tymi samymi odwołaniami do składników co szablon odniesienia.

Ilości składników są parametrami danych (`{milkAmount}` itp.), a nie swobodnymi zmianami treści kroku. Sama deklaracja `context` lub skopiowanie id szablonu nie wystarcza: brak kotwicy, zdublowane id albo zmieniona treść kroku przy tych samych id czynią **wszystkie** reguły niedostępnymi. Wersja szablonu jest niezależna od `catalogVersion`; zmiana struktury lub znaczenia kroków wymaga nowej `templateVersion` i ponownego przeglądu reguł.

**Konsekwencja dla S-02:** ten katalog obsługuje zamianę tylko dla przepisu zgodnego z szablonem `crepes-basic` w wersji 1. S-02 musi generować wejście zgodne z tym szablonem albo obsłużyć odmowę — inna struktura naleśników może zostać odrzucona. Nie mapujemy kroków po podobieństwie i nie wprowadzamy semantycznych ról kroków.

### Operacje na krokach (`instructionChanges`)

Uporządkowana lista operacji; kolejność tablicy to kolejność wykonania. `stepId` wskazuje kotwicę w oryginalnym, niezmienionym szablonie.

- `insert-before` — wstawia nowy krok przed kotwicą (np. `prepare-pea-drink` / `prepare-oat-drink` przed `mix-liquids`),
- `replace` — zastępuje krok kotwicy nowym krokiem o tym samym id (`mix-liquids`).

Teksty kroków używają placeholderów `{nazwa}` powiązanych z `parameters[]` (`ingredientId` + `field`: `amount`, `unit` lub `productName`), rozwiązywanych z wynikowej listy składników. Pozostałe kroki są zachowane bez zmian. Nie zastępujemy słów globalnie w swobodnym tekście; tekst po zamianie nie wspomina nazwy ani aliasów produktu źródłowego. Składnik zachowuje swoje lokalne id (`milk`), zmienia się jego `productId`, ilość i jednostka.

Przykład (`mix-liquids`):

- przed: „Odmierz {milkAmount} {milkUnit} składnika: {milkName}. Dodaj {eggsAmount} {eggsUnit} składnika: {eggsName}. Wymieszaj trzepaczką do połączenia.”
- wstawiony krok: „Wstrząśnij opakowaniem składnika: {drinkName}, aby wymieszać jego zawartość. Następnie odmierz {drinkAmount} {drinkUnit} tego napoju do ciasta.”
- po: „Do miski wlej odmierzone {drinkAmount} {drinkUnit} składnika: {drinkName}. Dodaj {eggsAmount} {eggsUnit} składnika: {eggsName}. Wymieszaj trzepaczką do połączenia.”

## Przepis odniesienia `crepes-basic-v1`

Naleśniki bez nadzienia, szablon `crepes-basic` v1: 120 g mąki pszennej (`flour`), 360 ml mleka krowiego (`milk`), 2 szt. jajka kurzego (`eggs`), 15 ml oleju rzepakowego do natłuszczania patelni (`oil`). Kroki: `mix-liquids`, `add-flour`, `rest-batter`, `prepare-pan`, `cook-crepes`, `serve-crepes`. Każdy składnik występuje na liście i jest użyty w krokach. To metryczna propozycja agenta inspirowana przepisem University of Maine, bez deklaracji liczby porcji.

## Przykłady odbioru (`CatalogCase`)

Każdy przypadek ma `id`, `caseKind`, `catalogVersion`, `recipe`, `exclusionIds`, opcjonalnie `testOnlyOverlay` i `templateMismatch`, oraz `expected` z polami `outcome`, `reason`, `conflicts` (ścieżki od produktu składnika do wykluczonego produktu), `substitutionIds`, `skippedSubstitutions` (wymagane; `substitutionId`, `reason`, `path`) i — przy wyniku `accepted`/`substituted` — pełnym `recipe`.

Zamknięte słowniki (wybrane przy implementacji fazy 2, **przedmiot odbioru właściciela**):

- `outcome`: `accepted` | `substituted` | `rejected`,
- `reason`: `no-conflict` (accepted), `conflict-resolved` (substituted), `unresolved-conflict` | `unknown-ingredient` (rejected),
- `skippedSubstitutions[].reason`: `target-conflict` | `incomplete-rule` | `context-mismatch` | `template-mismatch` | `unit-mismatch`,
- `templateMismatch`: `template-id` | `template-version` | `missing-anchor` | `duplicate-step-id` | `changed-step-text`,
- `caseKind`: `compatible-unchanged`, `substitution-first-candidate`, `substitution-fallback`, `indirect-conflict-rejected`, `direct-conflict-rejected`, `unknown-ingredient`, `ambiguous-name`, `incomplete-rule-quantity`, `incomplete-rule-instructions`, `context-mismatch`, `unit-mismatch`, `template-mismatch`, `full-revalidation` (każdy wymagany co najmniej raz).

Uwagi do modelu:

- Nieznany składnik ma jawne `name` bez `productId` (`CatalogUnknownIngredient`), a nie udawane odwołanie. Niejednoznaczne „mleko” i nieznany składnik mają ten sam `reason: unknown-ingredient`; rozróżnia je `caseKind` (`ambiguous-name` vs `unknown-ingredient`).
- `testOnlyOverlay` usuwa wymagane pola z kopii wskazanych reguł tylko na potrzeby jednego przypadku; obejmuje wszystkich kandydatów, aby odmowa nie pomijała poprawnego fallbacku. Nie zmienia aktywnych reguł katalogu.
- Warianty przepisu (`crepes-walnut`, `crepes-pea`, `crepes-vanilla`, `pancakes-basic`) mają własne `templateId`. Oczekiwany przepis po zamianie zachowuje `id`/`templateId`/`templateVersion` wejścia. Porównanie struktury z szablonem dotyczy wyłącznie przepisów wejściowych.

Lista 18 przypadków (`src/data/meal-catalog-cases.v1.json`):

| id                                          | caseKind                     | oczekiwany wynik                                                                                              |
| ------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `crepes-no-exclusions-unchanged`            | compatible-unchanged         | accepted — przepis bez zmian                                                                                  |
| `us-01-cow-milk-to-pea-drink`               | substitution-first-candidate | substituted — 360 ml → 360 ml napoju grochowego                                                               |
| `cow-milk-and-pea-fallback-to-oat-drink`    | substitution-fallback        | substituted — napój grochowy pominięty (`pea-drink-unsweetened → pea-protein → pea`), 360 ml napoju owsianego |
| `wheat-flour-indirect-conflict-rejected`    | indirect-conflict-rejected   | rejected — `wheat-flour → wheat`                                                                              |
| `walnut-variant-direct-conflict-rejected`   | direct-conflict-rejected     | rejected — orzech włoski w wariancie                                                                          |
| `pea-product-direct-conflict-rejected`      | direct-conflict-rejected     | rejected — groch w wariancie                                                                                  |
| `unknown-ingredient-rejected`               | unknown-ingredient           | rejected — „ekstrakt waniliowy” nierozpoznany                                                                 |
| `ambiguous-milk-name-rejected`              | ambiguous-name               | rejected — „mleko” nierozpoznane                                                                              |
| `rules-without-quantity-rejected`           | incomplete-rule-quantity     | rejected — obie reguły bez proporcji                                                                          |
| `rules-without-instructions-rejected`       | incomplete-rule-instructions | rejected — obie reguły bez instrukcji                                                                         |
| `crepes-rules-not-inherited-by-pancakes`    | context-mismatch             | rejected — kontekst `pancakes`                                                                                |
| `milk-in-grams-not-converted`               | unit-mismatch                | rejected — 370 g mleka, brak konwersji                                                                        |
| `template-mismatch-template-id`             | template-mismatch            | rejected — `crepes-custom`                                                                                    |
| `template-mismatch-template-version`        | template-mismatch            | rejected — `crepes-basic` v2                                                                                  |
| `template-mismatch-missing-anchor`          | template-mismatch            | rejected — brak kroku `mix-liquids`                                                                           |
| `template-mismatch-duplicate-step-id`       | template-mismatch            | rejected — powtórzone `mix-liquids`                                                                           |
| `template-mismatch-changed-step-text`       | template-mismatch            | rejected — zmieniona treść `mix-liquids`                                                                      |
| `milk-and-wheat-full-revalidation-rejected` | full-revalidation            | rejected — konflikt pszenicy pozostaje mimo możliwej zamiany mleka                                            |

## Granica: kontrola integralności a wykonanie reguł (S-02)

`checkCatalog` sprawdza dane, a **nie** wykonuje przepisów ani doboru zamienników. Obejmuje m.in.: wersje i wymagane pola, dokładny zestaw czterech wykluczeń, unikalne id, normalizację i jednoznaczność nazw, odwołania `contains` i brak cykli, priorytety, dodatnie proporcje i obsługiwane jednostki, kompletność instrukcji, zgodność `appliesTo` z szablonem, unikalność id kroków szablonu, powiązanie operacji z krokami, placeholdery ↔ parametry, użycie każdego składnika w krokach, identyfikatory produktów w przepisach, obecność wymaganych `caseKind` i kształt oczekiwanych wyników. Dodatkowo: cel reguły nie może zawierać źródła, źródło musi występować w szablonie, tekst zastąpionych kroków nie może wspominać nazwy ani aliasów źródła, a oczekiwane `conflicts` muszą równać się rzeczywistym konfliktom grafu.

Przykłady „odrzuć” są zapisanym kontraktem i przedmiotem ręcznego odbioru. Dopiero S-02 porówna je z działającym silnikiem walidacji (jedna runda zamian, ponowna walidacja całości). Testy celowo uszkodzonych danych działają na kopiach w pamięci i nie trafiają do aktywnych danych aplikacji.

## Wersjonowanie i zmiany

- Zmiana **treści** katalogu lub przykładów zwiększa `catalogVersion` i aktualizuje `catalogVersion` przypadków (katalog i przykłady zmienia się razem). Nie usuwa się ani nie wykorzystuje ponownie istniejących id.
- Zmiana **kształtu** kontraktu wymaga nowej `schemaVersion` i jawnego dostosowania konsumentów (`types.ts`, `data-contract.ts`, kontrola, S-01/S-02/S-04).
- Zmiana struktury lub znaczenia kroków szablonu wymaga nowej `templateVersion` i ponownego przeglądu reguł.
- Sam odbiór nie zmienia treści JSON, dzięki czemu skróty SHA-256 w zapisie odbioru pozostają stabilne. Każda korekta JSON unieważnia wcześniejszy odbiór i wymaga kontroli oraz ponownego przeglądu zmienionej wersji.
- Nowe źródła i zmiany CI unieważniają `context/deployment/source-manifest.sha256`; kolejna publikacja wymaga ponownego odbioru stagingu zgodnie z [deploy-plan.md](../../context/deployment/deploy-plan.md).

## Propozycja a potwierdzony odbiór

|       | Propozycja danych                          | Potwierdzony odbiór                                                          |
| ----- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Kto   | agent przygotowujący dane                  | właściciel produktu                                                          |
| Gdzie | JSON (`review.status: pending`)            | `catalog-review.md` z `catalogVersion`, SHA-256 obu JSON, datą i recenzentem |
| Dowód | przejście `check:catalog` i `test:catalog` | jawna odpowiedź właściciela po przejrzeniu pokazanych danych                 |

Odbiór obejmuje produkty i powiązania, kolejność napój grochowy → owsiany, proporcję 1:1, zmiany instrukcji oraz oczekiwane wyniki wszystkich przykładów. Próba kuchenna nie jest warunkiem odbioru.

## Źródła kulinarne

- [University of Maine — Crêpes](https://extension.umaine.edu/food-health/recipes/crepes/) — odczyt 2026-10-18; punkt odniesienia dla prostych naleśników i użycia napojów roślinnych. Metryczne ilości są roboczą adaptacją agenta.
- [King Arthur Baking — How to bake dairy-free](https://www.kingarthurbaking.com/blog/2018/05/10/how-to-bake-dairy-free) — odczyt 2026-10-18; pomocnicze uzasadnienie proporcji 1:1 dla niesłodzonych, neutralnych napojów roślinnych; zakres pozostaje ograniczony do naleśników.
