<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Sprawdzony katalog pierwszego posiłku

- **Plan**: `context/changes/verified-first-meal-catalog/plan.md`
- **Mode**: Deep
- **Date**: 2026-10-18
- **Verdict**: SOUND
- **Verdict before triage**: REVISE
- **Findings**: 0 critical, 2 warnings, 0 observations; oba ostrzeżenia poprawione w planie.
- **Triage authorization**: Użytkownik polecił „uzyj rekomendowanych”; zastosowano poprawkę F1 i wariant A dla F2 bez ponownego pytania o tę samą decyzję.

## Verdicts

| Dimension             | Before triage | Verdict |
| --------------------- | ------------- | ------- |
| End-State Alignment   | PASS          | PASS    |
| Lean Execution        | PASS          | PASS    |
| Architectural Fitness | WARNING       | PASS    |
| Blind Spots           | PASS          | PASS    |
| Plan Completeness     | WARNING       | PASS    |

## Grounding

Przed triage: 11/11 ścieżek rozpoznanych (3 istniejące pliki do zmiany, 8 jawnie planowanych nowych), 3/3 symboli/obszarów konfiguracji potwierdzone, brief↔plan zgodne. Progress: 3 fazy i 11 kryteriów zgodnych jeden do jednego. W ramach F1 plan dodaje dziewiąty nowy plik — src/lib/catalog/data-contract.ts; łącznie obejmuje teraz 12 unikalnych ścieżek implementacji.

Sprawdzono package.json, tsconfig.json i dziedziczone konfiguracje Astro, eslint.config.js, CI, skrypty smoke/deploy-manifest, wzorzec config-status.ts oraz odwołania do nowych nazw w kodzie. Nie ma istniejących odbiorców katalogu ani konwencji kroków przepisu. Ścieżki nowych plików nie są błędnymi odwołaniami do istniejącej implementacji.

Potwierdzono zgodność skryptów Node bez nowych zależności z konfiguracją scripts/**/*.mjs i CI. Manifest wdrożenia obejmuje nowe źródła automatycznie; jego historyczna wersja nie jest sprawdzana przez bieżące lint/check/build. Review i triage nie uruchamiają wdrożenia ani silnika produktu.

## Findings

### F1 — Typy TypeScript nie są powiązane z JSON

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — szybka decyzja; poprawka jest oczywista i wąska.
- **Dimension**: Architectural Fitness
- **Location**: Phase 1 — publiczny kontrakt danych; Phase 2 — kontrola i testy danych.
- **Detail**: Pierwotny plan tworzył osobne deklaracje TypeScript, JSON i kontrolę w JavaScript bez wymogu statycznego powiązania danych z publicznym typem. Astro strict umożliwia importy JSON, ale nie sprawdza zgodności z nieużywanym CatalogData. Skrypty .mjs nie mają włączonego checkJs, a eslint.config.js wyłącza dla nich reguły wymagające typów. Obie niezależne kontrole mogły więc przejść mimo rozbieżności struktur. Istniejący wzorzec src/lib/config-status.ts wiąże rzeczywiste dane z interfejsem przez typowane przypisanie.
- **Fix**: Dodać kontrolowany przez kompilator data-contract.ts, który wiąże rzeczywisty katalog i rzeczywiste przykłady JSON z eksportowanymi typami bez rzutowań maskujących błędy. W istniejącym teście katalogu potwierdzić, że usunięcie wymaganego pola w każdej z dwóch kopii JSON powoduje diagnostykę zgodności typów.
- **Decision**: FIXED — zastosowano jedyną zaproponowaną poprawkę.
- **Applied changes**: Phase 1 wymienia types.ts i data-contract.ts; na tym etapie most obejmuje istniejący już katalog. Phase 2 rozszerza go o przykłady i dodaje negatywną weryfikację z zainstalowanym kompilatorem TypeScript bez zmiany danych źródłowych. Brief zawiera tę samą decyzję. Doprecyzowano zakres istniejących kryteriów 1.2, 2.2 i 2.3 bez zmiany ich tytułów lub numerów.

### F2 — Brakuje warunku dostępności zmian instrukcji

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — rzeczywisty kompromis; wymaga rozważenia.
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — reguły zamian; Phase 2 — przykłady odmowy.
- **Detail**: Pierwotny plan ograniczał regułę do context=crepes, ale instrukcje odwoływały się do konkretnych id kroków przepisu odniesienia. Dla innego przepisu na naleśniki brakowało warunku dostępności przy innym szablonie, brakującej lub zdublowanej kotwicy albo zmienionej treści pod tym samym id. W aktualnym kodzie nie ma modelu przepisu, który rozstrzygałby ten kontrakt.
- **Fix A ⭐ Recommended**: Powiązać reguły z wersjonowanym szablonem i określić je jako niedostępne dla niezgodnych struktur; dodać przykłady odbioru.
  - Strength: Najmniejszy zakres dla pierwszego posiłku, bez nowego systemu ról kroków.
  - Tradeoff: S-02 musi generować zgodny szablon albo obsługiwać niedostępną zamianę i odrzucenie propozycji.
  - Confidence: HIGH — brak istniejących odbiorców wymagających migracji.
  - Blind spot: Generowanie zgodnego wejścia będzie weryfikowane w S-02.
- **Fix B**: Zdefiniować semantyczne role kroków, wymagane role i zasady ich jednoznaczności.
  - Strength: Umożliwia obsługę różnych struktur naleśników.
  - Tradeoff: Większy kontrakt i zakres testów na starcie.
  - Confidence: MED — wykonalne, lecz brak istniejącego wzorca w projekcie.
  - Blind spot: Generowanie poprawnych ról nie zostało sprawdzone.
- **Decision**: FIXED — zastosowano Fix A.
- **Applied changes**: Reguły otrzymują appliesTo z templateId=crepes-basic i templateVersion=1, a przepis — odpowiadające pola. Dostępność wymaga również zgodnej kolejności, treści i odwołań w wejściowych krokach oraz unikalnych id; skopiowanie identyfikatora szablonu nie wystarcza. Dodano odmowy dla innego szablonu/wersji, brakującej kotwicy, zdublowanego id i zmienionej treści przy tych samych id. Integralność szablonu i odwołań jest sprawdzana w F-01; wykonanie odmowy należy do S-02. Zaktualizowano dokumentację, ręczny odbiór przykładów i brief.

## Exact Edit Examples

F1, przed:

> **File**: `src/lib/catalog/types.ts`

F1, po:

> **Files**: `src/lib/catalog/types.ts`, `src/lib/catalog/data-contract.ts`

Nowy kontrakt wymaga rzeczywistych importów JSON i zabrania rzutowań oraz wyłączeń diagnostyki, które maskowałyby niezgodność. Przykłady są dołączane w fazie 2, kiedy powstaje ich plik.

F2, przed:

> Kontekst crepes jest jedynym kontekstem reguł.

F2, po:

> Kontekst crepes jest jedynym kontekstem reguł; dostępność wymaga również zgodnego appliesTo i struktury wejściowych kroków.

Warunek rozwinięto w modelu danych, przykładach i przekazaniu do S-02. Zmieniane są dokumenty planistyczne; wykonanie tych kontraktów pozostaje pracą implementacyjną.

## Triage Summary

- **Fixed**: F1, F2 (Fix A).
- **Skipped**: brak.
- **Accepted**: brak nierozwiązanych ustaleń zaakceptowanych jako ryzyko.
- **Dismissed**: brak.
- **Verdict after fixes**: REVISE → SOUND.
- **Verification**: Sprawdzono zgodność planu i briefu z poprawkami F1/F2 oraz zachowanie wszystkich 11 tytułów/numerów Progress z odpowiadającymi kryteriami faz. Wszystkie wiersze pozostają niewykonane; brief ma 79 linii, a plan obejmuje 12 unikalnych ścieżek implementacji. Dokumenty sformatowano przez Prettier. Kontrole implementacji i odbiór danych pozostają niewykonane.
