# Odbiór katalogu posiłków — verified-first-meal-catalog

> Zapis odbioru danych F-01. Wynik przeglądu: **zatwierdzony** 2026-10-19 przez właściciela produktu po jawnej odpowiedzi dotyczącej pokazanych danych. Sukces kontroli automatycznych nie jest odbiorem. Kontrakt danych: [docs/catalog/README.md](../../../docs/catalog/README.md).

## Identyfikacja danych

| Pole                                          | Wartość                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| schemaVersion                                 | 1                                                                  |
| catalogVersion                                | 1                                                                  |
| `src/data/meal-catalog.v1.json` SHA-256       | `ddb427f82dd196e0fd2882cf04ac90af318bc8c794b261d5595c7d970a220f39` |
| `src/data/meal-catalog-cases.v1.json` SHA-256 | `1cc136ae7791efba7acd5bf8acbbda85f24db7c7990786a5820924e8980656a7` |
| Data zapisu                                   | 2026-10-19                                                         |
| Osoba dokonująca odbioru                      | Dawid Nowak (właściciel produktu)                                  |

Skróty obliczono poleceniem `shasum -a 256 src/data/meal-catalog.v1.json src/data/meal-catalog-cases.v1.json`. Każda zmiana któregokolwiek pliku JSON unieważnia ten zapis i wymaga ponownej kontroli oraz przeglądu zmienionej wersji.

## Wynik kontroli automatycznych

Uruchomione lokalnie 2026-10-19 na Node 22.23.3, dla powyższych skrótów:

- `npm run check:catalog` — przeszło: 12 produktów, 2 reguły zamian, 18 przypadków, 0 diagnostyk.
- `npm run test:catalog` — przeszło: 49 testów, 0 błędów.
- `npx --no-install astro sync`, `npm run lint`, `npx --no-install astro check` (0 błędów), `npm run build` — przeszły.

## Wynik przeglądu produktów, powiązań i reguł

**Wynik: zatwierdzony** (2026-10-19, Dawid Nowak).

Zakres zatwierdzenia:

1. **Produkty (12):** `cow-milk` (mleko krowie), `wheat` (pszenica), `walnut` (orzech włoski), `pea` (groch), `wheat-flour` (mąka pszenna), `hen-egg` (jajko kurze), `rapeseed-oil` (olej rzepakowy), `water` (woda), `oat` (owies), `pea-protein` (białko grochu), `pea-drink-unsweetened` (napój grochowy niesłodzony), `oat-drink-unsweetened` (napój owsiany niesłodzony). Wybieralne wykluczenia: dokładnie `cow-milk`, `wheat`, `walnut`, `pea`; owies nie jest wykluczeniem.
2. **Łańcuchy `contains`:**
   - `wheat-flour → wheat`
   - `pea-protein → pea`
   - `pea-drink-unsweetened → water, pea-protein, rapeseed-oil` (pełny łańcuch: napój → białko grochu → groch)
   - `oat-drink-unsweetened → water, oat, rapeseed-oil`
   - pozostałe produkty: brak relacji, czyli brak powiązania z czterema wykluczeniami w zamkniętym profilu katalogowym (nie analiza etykiet ani marek).
3. **Nazwy:** tylko nazwa i jawny alias; „mleko” nie oznacza `cow-milk` i jest nierozpoznane.
4. **Przepis odniesienia `crepes-basic-v1`** (szablon `crepes-basic` v1): 120 g mąki pszennej, 360 ml mleka krowiego, 2 szt. jajka kurzego, 15 ml oleju rzepakowego do natłuszczania patelni; kroki `mix-liquids`, `add-flour`, `rest-batter`, `prepare-pan`, `cook-crepes`, `serve-crepes`.
5. **Kolejność zamienników mleka (kontekst `crepes`, tylko szablon `crepes-basic` v1):** 1. napój grochowy niesłodzony, 2. napój owsiany niesłodzony. To propozycja danych, nie ranking zdrowotny.
6. **Proporcja:** 1 ml → 1 ml (360 ml mleka → 360 ml napoju); brak konwersji g ↔ ml.
7. **Zmiany instrukcji** (identyczne w obu regułach poza id wstawianego kroku `prepare-pea-drink` / `prepare-oat-drink`):
   - przed — `mix-liquids`: „Odmierz {milkAmount} {milkUnit} składnika: {milkName}. Dodaj {eggsAmount} {eggsUnit} składnika: {eggsName}. Wymieszaj trzepaczką do połączenia.”
   - wstawione przed `mix-liquids`: „Wstrząśnij opakowaniem składnika: {drinkName}, aby wymieszać jego zawartość. Następnie odmierz {drinkAmount} {drinkUnit} tego napoju do ciasta.”
   - po — `mix-liquids`: „Do miski wlej odmierzone {drinkAmount} {drinkUnit} składnika: {drinkName}. Dodaj {eggsAmount} {eggsUnit} składnika: {eggsName}. Wymieszaj trzepaczką do połączenia.”
   - pozostałe kroki bez zmian; po zamianie tekst nie wspomina mleka krowiego.

## Wynik przeglądu przypadków

**Wynik: zatwierdzony** (2026-10-19, Dawid Nowak) — wszystkie 18 przypadków oraz zamknięte słowniki.

Właściciel ocenia także zamknięte słowniki wybrane przy implementacji fazy 2: `caseKind`; `outcome` (`accepted` / `substituted` / `rejected`); `reason` (`no-conflict` / `conflict-resolved` / `unresolved-conflict` / `unknown-ingredient`); przyczyny pominięcia reguły (`target-conflict` / `incomplete-rule` / `context-mismatch` / `template-mismatch` / `unit-mismatch`); rodzaje `templateMismatch`. Niejednoznaczne „mleko” i nieznany składnik mają ten sam `reason: unknown-ingredient`, a rozróżnia je `caseKind`.

| id przypadku                                | wykluczenia     | oczekiwany wynik                                                                                                              |
| ------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `crepes-no-exclusions-unchanged`            | —               | accepted / no-conflict; przepis bez zmian                                                                                     |
| `us-01-cow-milk-to-pea-drink`               | cow-milk        | substituted; 360 ml mleka → 360 ml napoju grochowego, kroki wg zmian powyżej                                                  |
| `cow-milk-and-pea-fallback-to-oat-drink`    | cow-milk, pea   | substituted; napój grochowy pominięty (target-conflict: `pea-drink-unsweetened → pea-protein → pea`), 360 ml napoju owsianego |
| `wheat-flour-indirect-conflict-rejected`    | wheat           | rejected / unresolved-conflict; `wheat-flour → wheat`                                                                         |
| `walnut-variant-direct-conflict-rejected`   | walnut          | rejected / unresolved-conflict; wariant z 30 g orzecha włoskiego                                                              |
| `pea-product-direct-conflict-rejected`      | pea             | rejected / unresolved-conflict; wariant ze 100 g grochu                                                                       |
| `unknown-ingredient-rejected`               | —               | rejected / unknown-ingredient; „ekstrakt waniliowy” 5 ml                                                                      |
| `ambiguous-milk-name-rejected`              | —               | rejected / unknown-ingredient; „mleko” 360 ml                                                                                 |
| `rules-without-quantity-rejected`           | cow-milk        | rejected / unresolved-conflict; overlay usuwa `quantity` z obu reguł (incomplete-rule)                                        |
| `rules-without-instructions-rejected`       | cow-milk        | rejected / unresolved-conflict; overlay usuwa `instructionChanges` z obu reguł (incomplete-rule)                              |
| `crepes-rules-not-inherited-by-pancakes`    | cow-milk        | rejected / unresolved-conflict; kontekst `pancakes` (context-mismatch)                                                        |
| `milk-in-grams-not-converted`               | cow-milk        | rejected / unresolved-conflict; 370 g mleka (unit-mismatch)                                                                   |
| `template-mismatch-template-id`             | cow-milk        | rejected; `templateId` `crepes-custom` (template-mismatch)                                                                    |
| `template-mismatch-template-version`        | cow-milk        | rejected; `crepes-basic` v2 (template-mismatch)                                                                               |
| `template-mismatch-missing-anchor`          | cow-milk        | rejected; brak kroku `mix-liquids` (template-mismatch)                                                                        |
| `template-mismatch-duplicate-step-id`       | cow-milk        | rejected; powtórzone id `mix-liquids` (template-mismatch)                                                                     |
| `template-mismatch-changed-step-text`       | cow-milk        | rejected; treść `mix-liquids` zmieniona na podgrzewanie mleka (template-mismatch)                                             |
| `milk-and-wheat-full-revalidation-rejected` | cow-milk, wheat | rejected / unresolved-conflict; konflikt pszenicy pozostaje mimo możliwej zamiany mleka                                       |

## Potwierdzenie właściciela

- Osoba: Dawid Nowak (właściciel produktu)
- Data: 2026-10-19
- Produkty, powiązania (w tym olej rzepakowy w obu napojach), kolejność napój grochowy → owsiany, proporcje 1:1 ml i zmiany instrukcji w kontekście `crepes`: **zatwierdzone**.
- Oczekiwane wyniki 18 przypadków, w tym pominięcie napoju grochowego, odmowy i brak domyślnego znaczenia „mleko”, oraz zamknięte słowniki: **zatwierdzone**.
- Uwagi: brak.
- Dotyczy danych o skrótach SHA-256 `ddb427f82dd196e0fd2882cf04ac90af318bc8c794b261d5595c7d970a220f39` (katalog) i `1cc136ae7791efba7acd5bf8acbbda85f24db7c7990786a5820924e8980656a7` (przypadki). Zmiana któregokolwiek pliku unieważnia ten odbiór.
