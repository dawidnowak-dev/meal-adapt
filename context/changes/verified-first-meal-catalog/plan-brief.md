# Sprawdzony katalog pierwszego posiłku — Plan Brief

> Pełny plan: [plan.md](plan.md)

## What & Why

Przygotowujemy F-01: minimalny katalog, który pozwoli później sprawdzić pierwszy posiłek i zamienić mleko krowie w naleśnikach według jawnych reguł. Dane i przykłady mają umożliwić odbiór kolejnych funkcji bez polegania na zapewnieniu modelu AI.

## Starting Point

Istnieje starter Astro/React/TypeScript, Supabase Auth i CI z lint/check/build oraz smoke logowania. Nie ma katalogu, modelu produktów, reguł zamian ani ich testów.

## Desired End State

W repozytorium jest wersjonowany katalog czterech wykluczeń, składniki naleśników i uporządkowane reguły zamiany mleka związane z wersjonowanym szablonem przepisu. Automatyczna kontrola pilnuje spójności danych, a twórca zatwierdza ich treść oraz oczekiwane wyniki przykładów. S-01, S-02 i S-04 dostają wspólny kontrakt do dalszej implementacji.

## Key Decisions Made

| Decyzja           | Wybór                                                                   | Powód                                                                  | Źródło                                   |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| Wykluczenia       | Mleko krowie, pszenica, orzechy włoskie i groch                         | Ustalony początkowy zakres                                             | PRD                                      |
| Konflikt pośredni | Cały jawny łańcuch contains; bez cykli                                  | Relacje nie wymagają powielania przy każdym produkcie                  | Odpowiedź 1                              |
| Autor danych      | Agent przygotowuje propozycję do odbioru twórcy                         | Użytkownik przekazał przygotowanie zawartości                          | Odpowiedź 2                              |
| Zakres zamian     | Wyłącznie naleśniki, kontekst crepes i zgodny szablon                   | Odbiór pozostaje ograniczony do pierwszego przepływu                   | Odpowiedź 3                              |
| Nazwy             | Jednoznaczne nazwy i jawne aliasy; samo „mleko” nierozpoznane           | Brak domyślnego znaczenia niejasnego składnika                         | Odpowiedź 4                              |
| Odbiór            | Przegląd danych i przykładów, bez wymaganej próby kuchennej             | Konkretny odbiór katalogu przez twórcę                                 | Odpowiedź 5                              |
| Przechowywanie    | JSON w repo, kontrakt TypeScript, kontrola Node bez nowych pakietów     | Mały katalog i istniejące narzędzia wystarczą                          | Plan, analiza kodu                       |
| Pierwsza zamiana  | Napój grochowy, potem owsiany; oba 1 ml → 1 ml (1:1)                    | Lista demonstruje wybór i pominięcie kandydata przy wykluczeniu grochu | Propozycja agenta w przekazanym zakresie |
| Zgodność danych   | Rzeczywiste JSON sprawdzane względem publicznych typów, bez rzutowań    | Same nieużywane deklaracje TS nie zabezpieczają danych                 | Review F1, zaakceptowana poprawka        |
| Dostępność reguł  | appliesTo: crepes-basic, templateVersion=1 oraz zgodna struktura kroków | Sam kontekst crepes nie gwarantuje zgodności kotwic instrukcji         | Review F2, zaakceptowany wariant A       |

## Scope

**In scope:**

- 12 produktów, dokładnie 4 wybieralne wykluczenia, jawne relacje i dwie reguły zamiany mleka.
- Robocze naleśniki bez nadzienia: 120 g mąki pszennej, 360 ml mleka, 2 jajka, 15 ml oleju rzepakowego; po zamianie 360 ml odpowiedniego napoju.
- Kontrola integralności, testy błędnych danych, przykłady przyszłego zachowania i zapis ręcznego odbioru związany ze skrótami danych.

**Out of scope:**

- UI/API i dane użytkowników, Supabase/RLS, AI, silnik walidacji i wykonywanie zamian.
- Inne potrawy i niezgodne szablony naleśników, konwersje jednostek, zamiany wieloskładnikowe, zgadywanie nazw, pełna baza marek i analiza śladowych zanieczyszczeń.
- Wdrożenie, aktualizacja zależności i próba kuchenna jako bramka.

## Architecture / Approach

Pliki src/data/meal-catalog.v1.json i meal-catalog-cases.v1.json są źródłem danych i oczekiwań, src/lib/catalog/types.ts opisuje kontrakt, a data-contract.ts sprawdza rzeczywiste importy JSON względem tych typów bez rzutowań. Skrypt Node kontroluje strukturę, odwołania, nazwy, graf i kompletność reguł; CI uruchamia go razem z testami. Przykłady nie są jeszcze wykonywane przez silnik produktu — ten powstanie w S-02.

## Phases at a Glance

| Faza                            | Rezultat                                                  | Główne ryzyko                                             |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1. Kontrakt i dane katalogu     | Typy, powiązany JSON, przepis i reguły                    | Treść danych wymaga odbioru człowieka                     |
| 2. Kontrole i przykłady odbioru | Kontrola integralności, testy i wejścia/oczekiwane wyniki | Przypadki ujemne nie mogą zanieczyścić aktywnego katalogu |
| 3. CI i ręczny odbiór           | Polecenia npm, CI, dokumentacja i zapis przeglądu         | Sukces skryptu nie zastępuje zatwierdzenia treści         |

**Prerequisites:** Istniejący starter, npm i Node 22.23.3; dostęp do twórcy przy odbiorze fazy 3. Konta i sekrety nie są potrzebne.
**Estimated effort:** Orientacyjnie 2–3 sesje po około 2 godziny, plus czas przeglądu twórcy; to szacunek, nie termin gwarantowany.

## Open Risks & Assumptions

- Ilości i instrukcje są propozycją danych do przeglądu; nie deklarujemy przeprowadzonej próby kuchennej ani zatwierdzenia przed odbiorem.
- Wpis napoju oznacza opisany i przejrzany profil katalogowy, bez rozszerzania go na wszystkie podobnie nazwane produkty.
- Nowe źródła unieważnią historyczny manifest stagingu. F-01 go nie odświeża; kolejna publikacja wymaga ponownego odbioru stagingu.
- Repo nie ma pierwszego commitu, a pliki są nieśledzone; późniejsze commitowanie faz wymaga ostrożnego doboru plików.

- S-02 musi generować wejście zgodne z szablonem crepes-basic w wersji 1 lub obsłużyć odmowę; samo id szablonu bez zgodności kroków nie wystarcza.

## Success Criteria (Summary)

- Katalog i przykłady przechodzą kontrole integralności, testy, lint, zgodność rzeczywistych JSON z typami i build; testy ujemne wykrywają brak wymaganego pola.
- Twórca zatwierdza reguły i oczekiwania: mleko → napój grochowy; mleko+groch → napój owsiany; nieznany składnik lub nierozwiązany konflikt → odmowa.
- Odbiór wskazuje wersję i SHA-256 obu plików danych; S-02 może później wykonać te same przykłady rzeczywistym silnikiem.

## References

- [Pełny plan i Progress](plan.md), [roadmapa F-01](../../foundation/roadmap.md), [PRD](../../foundation/prd.md).
- [University of Maine — Crêpes](https://extension.umaine.edu/food-health/recipes/crepes/) i [King Arthur Baking — How to bake dairy-free](https://www.kingarthurbaking.com/blog/2018/05/10/how-to-bake-dairy-free): źródła propozycji kulinarnej, odczyt 2026-10-18; ilości metryczne są roboczą adaptacją agenta.
