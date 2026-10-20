---
project: MealAdapt
approved_at: 2026-10-08
reviewed_at: 2026-10-09
revision_approved_at: 2026-10-09
approval: User instructed "Implement the plan" after reviewing both the original plan and the revised plan.
status: staging-http-and-rollback-verified-awaiting-manual-checks
blockers:
  - staging-browser-and-mobile-form-checks-pending
  - staging-cpu-and-runtime-log-verification-pending
  - staging-supabase-site-url-not-independently-verified
staging_url: https://meal-adapt-staging.appsd.workers.dev
staging_baseline_version_id: c96fb814-b3ec-4d8f-ab0d-a9a79d192be8
staging_application_version_id: 697c2b61-8d99-4114-b865-18adb9b003fc
staging_deployment_id: be9c8208-e570-4771-810d-cfa2e2782cee
staging_deployed_at: 2026-10-09T21:34:59.497637Z
production_deployed: false
platform: Cloudflare Workers
deployment_method: manual-cli
scope: starter-auth-technical-demo
---

# Pierwsze wdrożenie MealAdapt

## Cel i zaakceptowane decyzje

Wdrożyć obecny starter z rejestracją, logowaniem i chronionym dashboardem na staging, następnie na produkcję. Źródła decyzji: `context/foundation/infrastructure.md` i `context/foundation/tech-stack.md`.

- Cloudflare Workers Free; adresy `workers.dev`; ręczny deploy przez Wrangler.
- Workery `meal-adapt-staging` i `meal-adapt`, bez Version URLs.
- Osobne Supabase Free: `meal-adapt-staging` i `meal-adapt-production`, region Frankfurt.
- Rejestracja e-mail/hasło bez potwierdzania adresu na czas technicznego demo.
- Node 22.23.3 (korekta z 22.14.0 opisana w dzienniku), Astro 7.3.2, adapter Cloudflare 14.3.1, Wrangler 4.131.1; npm i istniejący lockfile.
- Brak dodatkowych Images/KV: `session: false` i `imageService: "passthrough"`; cookies Supabase pozostają mechanizmem auth.
- CI sprawdza `main` i używa .nvmrc; auto-deploy po merge odłożono. Długoterminowa preferencja stacku pozostaje bez zmian.
- AI, przepisy, reset hasła, SMTP, własna domena i tabele aplikacji pozostają poza tym wdrożeniem. Nie wykonujemy migracji.

## Przygotowanie lokalne — agent

Konfiguracja Workerów, wyłączenie sessions/Images, komunikat rejestracji i CI dla main zostały już przygotowane. Poniższe kroki opisują również historycznie wykonane przygotowania; przy wznowieniu weryfikować istniejący stan, nie inicjalizować startera ponownie.

1. Zainstalować/aktywować Node 22.23.3, wykonać `npm ci` bez aktualizacji wersji paczek. Korekta względem zaakceptowanego 22.14.0 wynika z engines zależności z lockfile; uzasadnienie w dzienniku poniżej.
2. Skonfigurować oba Workery w wrangler.jsonc, zachować datę kompatybilności 2026-05-08, `nodejs_compat` i observability.
3. Wyłączyć nieużywane Astro sessions i Images; ignorować `.dev.vars.*`.
4. Na stronie `/auth/confirm-email` wyświetlić udaną rejestrację i możliwość logowania bez obietnicy wysłania wiadomości. Zachować endpointy auth.
5. Poprawić CI z master na main, bez publikacji. Nie wykonywać commit/push bez osobnego polecenia.
6. Wykonać lint, kontrolę typów, build i dry-run dla obu środowisk. Sprawdzić nazwy i bindingi wygenerowanego configu.
7. Przed lint uruchomić `npx --no-install astro sync`; używać lokalnych wersji narzędzi przez `npx --no-install`, bez pobierania latest.
8. Zapisać manifest SHA-256 źródeł, public assets, konfiguracji i lockfile w `context/deployment/source-manifest.sha256`. Nie obejmować sekretów, node_modules, dist ani zmiennego dziennika wdrożenia. W obecnym repo pliki aplikacji nie są śledzone przez Git, więc SHA repo nie wystarcza do identyfikacji kodu. Porównać manifest przed publikacją produkcji; zmiana wymaga ponownego odbioru stagingu. Nie wykonywać commit/push.
9. Zachować ocenę zgłoszeń audit i jej ograniczenia; nowa osiągalna podatność blokuje udostępnienie. Nie wykonywać automatycznego audit fix.

Manifest obejmuje też README i skrypty operacyjne. Zapis wykonać po ustaleniu źródeł, przed buildem i odbiorem stagingu:

```bash
node scripts/deploy-manifest.mjs write
```

Przed publikacją stagingu oraz produkcji wykonać `node scripts/deploy-manifest.mjs check`. Kontrola wykrywa zmianę zawartości, dodanie i usunięcie plików w objętych katalogach. Nie nadpisywać manifestu w celu obejścia niezgodności; ponownie zweryfikować staging.

## Ręczne bramki — właściciel

Właściciel wykonuje poniższe czynności w panelach dostawców; agent nie zastępuje ich szerokim OAuth tokenem.

1. Utworzyć dwa projekty Supabase Free w regionie Frankfurt. W obu pozostawić rejestrację e-mail/hasło i wyłączyć potwierdzanie e-maila. Minimalna długość hasła (Authentication → Policies) musi być równa `MIN_PASSWORD_LENGTH` z `src/lib/auth-errors.ts` i `minimum_password_length` w `supabase/config.toml` (obecnie 6), bo komunikaty walidacji i błędu słabego hasła podają tę liczbę. Nie używać service_role: SUPABASE_KEY to anon/publishable.
2. Utworzyć lub zweryfikować Workery o dokładnych nazwach `meal-adapt-staging` i `meal-adapt`, z adresami workers.dev. Oba Workery początkowo odpowiadają statusem 503 i treścią „Wdrożenie w przygotowaniu”. Właściciel dodaje właściwe sekrety SUPABASE_URL i SUPABASE_KEY do obu wersji awaryjnych, zgodne z plikami dla danego środowiska, zanim zapiszemy baseline version ID. Dzięki temu planowana publikacja nie zmienia sekretów względem baseline. Minimalny kod wersji awaryjnej:

   ```js
   export default {
     fetch() {
       return new Response("Wdrożenie w przygotowaniu", {
         status: 503,
         headers: { "content-type": "text/plain; charset=utf-8" },
       });
     },
   };
   ```

3. Przygotować account-owned token Editor ograniczony do obu Workerów oraz osobny token Metadata Read-Only do logów. Bez DNS, billing, usuwania zasobów i szerokich uprawnień Admin dla agenta. Utworzenie Workerów wymaga uprawnień właściciela.
4. Token deploy i identyfikator konta udostępnić przez `CLOUDFLARE_API_TOKEN` i `CLOUDFLARE_ACCOUNT_ID` w środowisku sesji wykonawczej. Weryfikować tylko obecność i uprawnienia, nie wypisywać wartości tokena.
5. Przygotować `.dev.vars.staging` i `.env.production` w katalogu projektu, z odpowiadającymi im URL i kluczem Supabase:

   ```dotenv
   SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   SUPABASE_KEY=<ANON_OR_PUBLISHABLE_KEY>
   ```

Wartości pozostają w ignorowanych plikach; nie w rozmowie, dokumentacji ani repo. Osobny token read-only udostępnić agentowi na czas odczytu logów; nie zapisywać go w pliku z sekretami aplikacji.

Jeśli Worker o tej nazwie zawiera inną aplikację, brakuje dwóch slotów Supabase Free lub wymagany jest płatny dodatek, zatrzymać realizację przed zmianą zasobów i zgłosić konkretną przeszkodę. Nie kasować innych projektów ani nie zmieniać billing.

## Publikacja stagingu

### Aktualizacja procedury z realizacji 2026-10-09

Użytkownik uzupełnił `.env.staging` i `.env.production`, dodając także CLOUDFLARE_API_TOKEN i CLOUDFLARE_ACCOUNT_ID. Te pliki są wejściem lokalnej sesji CLI, a nie plikami do `--secrets-file`. Przed publikacją przygotować ignorowane `.dev.vars.staging` / `.dev.vars.production` z allowlistą wyłącznie SUPABASE_URL i SUPABASE_KEY. Nie kopiować całego `.env.*` do pliku Worker Secrets. Produkcyjny plik przygotować dopiero w realizacji osobno zleconej publikacji produkcji.

Wrangler 4.131.1 `deploy` przesłał i aktywował baseline stagingu, po czym zakończył się exit 1 na odczycie account-level `/workers/subdomain` (403/code 10000). Sprawdzono stan zdalny przed kolejną operacją. Z obecnym tokenem nie rozszerzamy uprawnień: routing konkretnego Workera ustawiono jego endpointem `/accounts/<ACCOUNT_ID>/workers/scripts/meal-adapt-staging/subdomain` (POST, enabled=true, previews_enabled=false); publikacja aplikacji używa `versions upload` i `versions deploy`. Obie komendy przeszły. To aktualna procedura stagingu; poniższy zwykły `deploy` pozostaje opisem pierwotnego wariantu i nie powinien być ponawiany z tym tokenem. [Routing API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/methods/create/).

Po aktywowaniu Node z .nvmrc i przygotowaniu allowlisty sekretów:

```bash
node scripts/deploy-manifest.mjs check
CLOUDFLARE_ENV=staging node --env-file=.env.staging node_modules/astro/bin/astro.mjs build
node --env-file=.env.staging node_modules/wrangler/bin/wrangler.js versions upload --config dist/server/wrangler.json --secrets-file .dev.vars.staging --message "Staging deployment"
node --env-file=.env.staging node_modules/wrangler/bin/wrangler.js versions deploy <STAGING_APPLICATION_VERSION_ID>@100% --config dist/server/wrangler.json --yes --message "Staging deployment"
```

Zastąpić version ID identyfikatorem nowo przesłanej wersji. Nie stosować starego ID przy nowym buildzie. Node `--env-file` przekazuje poświadczenia wyłącznie lokalnemu procesowi; publikowane sekrety pochodzą z jawnego pliku allowlisty.

Po ręcznych bramkach sprawdzić tożsamość konta, zakres tokena oraz odrębność projektów, bez wypisywania sekretów. Gdy bramki nie są gotowe, można ukończyć lokalne kontrole i dry-run, ale nie publikować bez auth.

```bash
CLOUDFLARE_ENV=staging npm run build
npx --no-install wrangler deploy --config dist/server/wrangler.json --dry-run
npx --no-install wrangler deployments list --name meal-adapt-staging --json
npx --no-install wrangler deploy --config dist/server/wrangler.json --secrets-file .dev.vars.staging
```

Każde polecenie wykonać osobno i sprawdzić exit code przed następnym. Wygenerowany config ma wskazywać `meal-adapt-staging`, właściwe assets, brak IMAGES i namespace SESSION. Nie przekazywać do deploy surowego entrypointu Astro; używać configu z bieżącego builda.

Przed publikacją zapisać baseline version ID i potwierdzić HTTP 503. Zapisać URL i version ID zwrócone przez deploy. Właściciel ustawia Supabase Site URL na zwrócony adres stagingu. Następnie:

```bash
BASE_URL=<STAGING_URL> npm run smoke
```

Smoke tworzy konto testowe i nie usuwa go. Sprawdzić także rejestrację/logowanie w przeglądarce, złe hasło, dashboard i wylogowanie; potwierdzić, że konto stagingowe nie istnieje w projekcie produkcyjnym. Odczytać logi/metryki CPU. Błędy runtime lub limitu CPU blokują produkcję; nie podnosić planu automatycznie.

Przed dopuszczeniem produkcji przeprowadzić próbny rollback stagingu do jego baseline, potwierdzić HTTP 503, następnie ponownie wdrożyć aplikację z tego samego builda i powtórzyć smoke:

```bash
npx --no-install wrangler rollback <STAGING_BASELINE_VERSION_ID> --name meal-adapt-staging --yes --message "First deployment rollback rehearsal"
npx --no-install wrangler deploy --config dist/server/wrangler.json --secrets-file .dev.vars.staging
BASE_URL=<STAGING_URL> npm run smoke
```

Wszystkie wartości w nawiasach ostrych są placeholderami do zastąpienia odczytanymi identyfikatorami/URL-ami, nie literalnymi argumentami shell.

## Publikacja produkcji

Zaakceptowany plan upoważnia do publikacji po pozytywnych testach stagingu; nie jest potrzebna powtórna zgoda na tę samą czynność. Odbudować produkcję z tego samego kodu, bo config stagingu i produkcji jest generowany oddzielnie.

```bash
env -u CLOUDFLARE_ENV npm run build
npx --no-install wrangler deploy --config dist/server/wrangler.json --dry-run
npx --no-install wrangler deployments list --name meal-adapt --json
npx --no-install wrangler deploy --config dist/server/wrangler.json --secrets-file .dev.vars.production
```

Przed ostatnim poleceniem zapisać wersję awaryjną baseline; sprawdzić nazwę `meal-adapt` i brak dodatkowych bindingów. Po publikacji zapisać URL i version ID. Właściciel ustawia Site URL produkcyjnego Supabase na otrzymany adres. Przetestować auth w przeglądarce na jednym koncie testowym. Pełny smoke uruchamiać tylko na stagingu.

To deployment Workers; nie używać `wrangler pages deploy`. Nie używać `wrangler secret put` do przygotowania publikacji, ponieważ od razu wdraża wersję. Klucz AI nie jest potrzebny dla startera.

## Odbiór, logi i rollback

- Oba adresy działają przez HTTPS; assets i formularze działają na telefonie oraz komputerze.
- Rejestracja działa bez potwierdzania adresu; strona sukcesu pokazuje poprawny komunikat.
- Błędne hasło nie uwierzytelnia; poprawne logowanie pozwala otworzyć dashboard.
- Anonimowy dashboard przekierowuje do logowania; wylogowanie odbiera dostęp.
- Konta i cookies auth należą do właściwego środowiska; projekty Supabase są odrębne.
- Brak błędów runtime/CPU; CPU sprawdzić w Workers metrics, nie wyprowadzać z czasu odpowiedzi sieciowej.

Z tokenem Metadata Read-Only:

```bash
npx --no-install wrangler tail meal-adapt-staging --format json
npx --no-install wrangler tail meal-adapt --format json
```

Sesje tail zakończyć po weryfikacji. Nie logować haseł, cookies ani kluczy. W razie awarii produkcji użyć deploy tokena:

```bash
npx --no-install wrangler rollback <BASELINE_VERSION_ID> --name meal-adapt --yes --message "First deployment rollback"
```

Sprawdzić, że wróciła odpowiedź 503 „Wdrożenie w przygotowaniu”. Nie usuwać kont ani projektów Supabase. Rollback nie cofa danych i migracji; w tym wdrożeniu nie ma migracji. Główną rotację sekretów i usuwanie zasobów wykonuje człowiek.

Jeżeli pojawi się nieoczekiwana różnica sekretów lub bindingów, zatrzymać automatyczną procedurę i przekazać właścicielowi przywrócenie baseline w panelu. Lokalny kod Wrangler 4.131.1 przewiduje dodatkową obsługę różnic sekretów; nie zakładać, że --yes rozstrzyga je bezpiecznie. Reguły uprawnień i rollbacku: [Workers roles](https://developers.cloudflare.com/workers/authorization/workers/), [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

Po odbiorze zapisać daty, manifest kodu, oba URL-e, baseline/application version ID, wyniki testów, metryki CPU i same nazwy sekretów. Status `deployed` nadać dopiero po pozytywnym odbiorze produkcji; wcześniej wskazywać konkretną oczekującą bramkę.

## Dziennik realizacji

- Plan zatwierdzony poleceniem „Implement the plan”.
- Kontrole sprzed zmian: lint/check przeszły; build przeszedł na Node 24.14.1, a Node 22.14.0 nie był zainstalowany.
- Odstępstwo techniczne: zainstalowano Node 22.14.0, lecz npm ci ujawniło niezgodne engines eslint-plugin-astro/astro-eslint-parser (^22.22.3) i undici (>=22.19.0). Pin narzędzi poprawiono na istniejące wydanie Node 22 LTS 22.23.3; nie zmieniono wersji paczek. README i kontrakty foundation są zaktualizowane, CI czyta .nvmrc.
- Kontrole po zmianach: npm ci na Node 22.23.3 bez ostrzeżeń engines; lint przeszedł; astro check: 29 plików, 0 errors/warnings/hints.
- Staging i produkcja: build oraz wrangler deploy --dry-run przeszły. Wygenerowane nazwy meal-adapt-staging/meal-adapt potwierdzone; workers.dev włączone, Version URLs wyłączone. Tylko binding ASSETS, bez IMAGES i namespace SESSION. Dry-run nie publikował żadnego Workera.
- Lokalny production preview (workerd): HTTP 200 strony głównej, signin, signup, strony sukcesu i zbudowanego assetu; anonimowy dashboard zwraca 302 do /auth/signin. Komunikat rejestracji nie obiecuje wysłania e-maila. Serwer preview zatrzymany po testach.
- Full auth smoke, testy przeglądarkowe auth i metryki CPU na platformie oczekują na przygotowane projekty/Workery. Przy braku sekretów nie wyprowadzamy wniosku o działającym auth.
- Build pomija sitemap, ponieważ docelowy URL nie jest jeszcze znany; po otrzymaniu adresów nie jest to kryterium blokujące starter auth.
- npm ci zgłosiło 11 podatności zależności (2 moderate, 9 high); nie oceniono jeszcze ich osiągalności w runtime ani nie wykonano npm audit fix. Wersje paczek zachowano zgodnie z zakresem planu.
- Dodatkowy odczyt npm audit --omit=dev: 10 zgłoszeń (2 moderate, 8 high), exit 1. Lista obejmuje @cloudflare/vite-plugin, devalue, fast-uri, http-cache-semantics, miniflare, sharp, smol-toml, source-map-js, undici i wrangler. Ten podział npm obejmuje także narzędzia przez zależności adaptera, więc nie jest dowodem osiągalności wszystkich podatności w opublikowanym Workerze. Przed udostępnieniem rozstrzygnąć osiągalność albo aktualizację zależności; nie uruchomiono automatycznego audit fix przy zatwierdzonych pinach paczek.
- Ręczne bramki: oczekują na właściciela; pliki sekretów i scoped token nie były obecne przy rozpoczęciu realizacji.
- Staging URL / version ID: nie wdrożono.
- Production URL / version ID / baseline ID: nie wdrożono.
- Sekrety wdrożone na platformę: brak; wymagane nazwy SUPABASE_URL i SUPABASE_KEY dla każdego Workera.
- Przed udostępnieniem właściwego MVP trzeba wdrożyć funkcje produktu, SMTP, potwierdzanie adresów i reset hasła.

### Wznowienie — 2026-10-09

- Użytkownik polecił kontynuować wdrożenie. Sprawdzenie obecności konfiguracji: .dev.vars.staging i .env.production nadal nie istnieją, CLOUDFLARE_API_TOKEN oraz CLOUDFLARE_ACCOUNT_ID nie są dostępne w sesji. Nie odczytywano ani nie wypisywano sekretów.
- Publikacja i pełny auth smoke nadal oczekują na ręczne bramki. Nie ponawiano zaliczonych kontroli ani nie publikowano niekompletnego startera.

### Ocena zgłoszeń audit w obecnym starterze — 2026-10-09

Ocena statyczna kodu i istniejącego production bundle; nie jest pełnym testem penetracyjnym ani potwierdzeniem braku wszystkich podatności. Nie zmieniono lockfile.

- http-cache-semantics w Astro służy do cache obrazów podczas builda (astro/dist/assets/build/remote.js). CachePolicy i ta biblioteka nie występują w obecnym Worker bundle; aplikacja nie udostępnia opisanego współdzielonego cache odpowiedzi auth. [Advisory](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)
- sharp, smol-toml, source-map-js oraz identyfikatory podatnych interceptorów undici nie występują w sprawdzonym bundle. Miniflare/Wrangler/Vite plugin należą do lokalnego/build/deploy tooling; samo npm --omit=dev nie oddziela ich od kodu hostowanego. Pozostają zgłoszenia dotyczące narzędzi i potrzeba ich późniejszej aktualizacji.
- devalue 5.9.2 jest w runtime obsługi Astro Actions, lecz starter nie definiuje Actions ani nie zwraca Node Buffer/typed-array w wynikach lub props. Nie znaleziono ścieżki ekspozycji shared backing-buffer przez obecną aplikację. Advisory wskazuje poprawkę 5.9.3; przed rozszerzeniem o nowe API/Actions ponownie ocenić lub zaktualizować tę zależność. [Advisory](https://github.com/advisories/GHSA-j22f-vq7h-c4qm)
- uneval nie występuje w Worker bundle, więc opisany przez advisory scenariusz parse → uneval nie jest używany w tym buildzie. Wystąpienie słowa stringifyAsync w bundle to tekst komunikatu błędu; nie potwierdza wywołania tej funkcji. Astro sessions są wyłączone. [Advisory uneval](https://github.com/advisories/GHSA-mcm9-63f2-9j32)
- Wniosek ograniczony do startera auth: nie wykazano osiągalnej ścieżki powyższych zgłoszeń przez aktualne funkcje aplikacji. Raport npm nie jest wyczyszczony; nie przedstawiać tego jako usunięcia podatności. Przed rozbudową MVP trzeba zaplanować kontrolowaną aktualizację zależności/narzędzi i powtórzyć ocenę.

### Realizacja poprawionego planu — 2026-10-09

- Użytkownik zatwierdził poprawiony plan poleceniem „Implement the plan”. Zapisano korekty bez usuwania wcześniejszego dziennika; wcześniejsze wpisy o brakujących plikach sekretów są historycznymi snapshotami.
- Oba pliki sekretów istnieją i są ignorowane przez Git. `.dev.vars.staging` zawiera poprawny format adresu hostowanego Supabase i klucz publishable; to kontrola statyczna, nie potwierdzenie działania auth. `.env.production` zawiera adres spoza oczekiwanego formatu hostowanego projektu Supabase oraz klucz nierozpoznany jako anon/publishable. Nie wypisywano ich wartości; produkcyjna konfiguracja wymaga uzupełnienia przez właściciela.
- CLOUDFLARE_API_TOKEN i CLOUDFLARE_ACCOUNT_ID nadal nie są dostępne w sesji wykonawczej. Nie sprawdzono zdalnego konta, zakresu tokena, stanu Workerów/baseline ani ustawień projektów Supabase.
- npm ci wykonano na zainstalowanym Node 22.23.3; lockfile i wersje zależności pozostają bez zmian. Kontrole: astro sync oraz lint przeszły; astro check: 29 plików, 0 errors/warnings/hints.
- Staging i produkcja: build oraz Wrangler 4.131.1 deploy --dry-run przeszły. Potwierdzono nazwy meal-adapt-staging / meal-adapt, workers.dev=true, preview_urls=false, compatibility_date=2026-05-08; dry-run pokazuje wyłącznie ASSETS, bez Images i KV/SESSION. Te kontrole nie potwierdzają poprawności produkcyjnych sekretów ani działania auth.
- Astro sync zgłosił brak prawa zapisu domyślnego pliku logów Wrangler, ale zakończył się sukcesem. Dalsze kontrole kierowały logi przez WRANGLER_LOG_PATH do /private/tmp/meal-adapt-deploy-logs. Ostrzeżenie o pominięciu sitemap przy braku site pozostaje nieblokujące dla technicznego demo.
- Dodano skrypt scripts/deploy-manifest.mjs oraz manifest context/deployment/source-manifest.sha256. Manifest pomija sekrety i artefakty builda; obejmuje źródła, public assets, skrypty, konfigurację, README, lockfile i CI. Weryfikacja musi być powtórzona bezpośrednio przed zdalną publikacją; lokalne kontrole poprzedzają końcową gotowość ręcznych bramek.
- Końcowy lint po dodaniu skryptu przeszedł. Manifest obejmuje 44 pliki; polecenie check zakończyło się sukcesem. SHA-256 pliku manifestu: `31ab82bac9cbfe810cdac29abf3f904780ff7bd7e185ed72ca2d6c7101f770c9`. Potwierdzono brak wartości kluczy Supabase w zmienionych dokumentach, skrypcie i manifeście.
- README uzgodniono z procedurą: lokalne wersje CLI, jawne wyłączenie CLOUDFLARE_ENV przy buildzie produkcji, baseline z sekretami, próba rollbacku na stagingu i faktyczna gałąź CI main.
- Nie publikowano stagingu ani produkcji, nie zmieniano sekretów na platformie, nie tworzono kont testowych i nie wykonywano migracji. Smoke, testy przeglądarkowe auth, odczyt CPU i próba rollbacku czekają na gotowe zasoby oraz poświadczenia. URL-e i version ID nadal nieustalone.
- Następna bramka: właściciel udostępnia scoped token i account ID w środowisku, poprawia .env.production oraz potwierdza oba projekty Supabase i Workery z baseline HTTP 503/właściwymi sekretami. Dopiero potem agent weryfikuje zasoby i realizuje sekcję Publikacja stagingu. Wcześniejsza akceptacja planu pozostaje ważna; nie wymaga ponownego pytania o tę samą publikację.

### Publikacja stagingu — 2026-10-09

- Użytkownik polecił deploy wyłącznie na staging po uzupełnieniu sekretów. Nie publikowano produkcji i nie odczytywano jej zasobów zdalnych.
- Konfigurację sesji wczytano z ignorowanego .env.staging, bez wypisywania wartości. Poprawny format hostowanego adresu Supabase, klucz publishable i account ID potwierdzone statycznie; uprawnienie do operacji na meal-adapt-staging potwierdzono przez API. Pełnej polityki tokena nie odczytano; odczyt subdomeny konta zwraca 403.
- Utworzono ignorowany .dev.vars.staging (mode 0600) z dokładnie SUPABASE_URL i SUPABASE_KEY. Zdalna weryfikacja bindings potwierdziła oba jako secret_text; token Cloudflare nie trafił do Workera.
- Od ostatniej walidacji zmienił się wyłącznie .gitignore (ignorowanie .env.staging). Zapisano nowy manifest 44 plików i przebudowano staging na Node 22.23.3; build i dry-run przeszły. SHA-256 manifestu: `1f1b90a10fe47056d376c4aab7dce204b2ce95e539dd088592e46dc634e588d8`. Bezpośrednia kontrola manifestu przed uploadem przeszła.
- Istniejący staging miał tylko szablon Cloudflare Hello World (jeden moduł worker.js, 568 znaków), bez bindings. Jego pierwotne version ID: be986bc0-369c-4768-ac80-b2e883f68eab. W ramach jawnie zleconego wdrożenia stagingu agent przygotował wersję awaryjną na istniejącym Workerze zamiast czekać na ręczne zastąpienie szablonu: bez tworzenia zasobów, rotacji istniejących sekretów ani podnoszenia uprawnień. Kod HTTP 503 zapisano lokalnie w ignorowanym .wrangler/staging-baseline; nie potwierdzono jeszcze odpowiedzi przez publiczny URL.
- Baseline version ID: c96fb814-b3ec-4d8f-ab0d-a9a79d192be8; deployment ID f866862a-96d6-4b78-a2da-6a293678e2fc. Po błędzie końcowego odczytu subdomeny potwierdzono przez listę deployments, że baseline został faktycznie aktywowany.
- Scoped endpoint routingu stagingu zwrócił enabled=true, previews_enabled=false. Nie rozszerzano zakresu tokena ani nie aktualizowano Wrangler do latest.
- Aplikacja opublikowana przez versions upload → versions deploy na 100% ruchu: version ID 697c2b61-8d99-4114-b865-18adb9b003fc, deployment ID 148b9cc5-055c-4b0e-95fb-d7cedbb9b626, created_on 2026-10-09T21:34:59.497637Z. Obie komendy zakończyły się sukcesem; odczyt API potwierdził aktywną wersję, routing i bindings ASSETS / SUPABASE_KEY / SUPABASE_URL.
- Workers startup time zgłoszony przy uploadzie aplikacji: 22 ms. To pomiar startu, nie CPU pojedynczego żądania; CPU ruchu aplikacji nie zmierzono.
- Odczyt Supabase /auth/v1/settings zwraca HTTP 200, emailEnabled=true, signupDisabled=false, mailerAutoconfirm=false. Potwierdzanie e-maila jest nadal włączone, co nie odpowiada założeniu technicznego demo. Właściciel ma je wyłączyć na stagingu.
- Staging jest opublikowany, ale jeszcze nie odebrany: brak publicznego URL w dostępnej konfiguracji oraz brak uprawnienia do odczytu subdomeny całego konta. Poproszono właściciela o URL workers.dev i wyłączenie Confirm email; Site URL Supabase pozostaje niepotwierdzony. Nie wykonano smoke, testów przeglądarkowych, odczytu CPU ani próby rollbacku. Nie utworzono kont testowych. Po otrzymaniu URL i potwierdzeniu auth kontynuować odbiór, próbę rollbacku i ponowne udostępnienie tej samej wersji aplikacji.

### Weryfikacja stagingu i rollback — 2026-10-10 (Europe/Warsaw)

- Użytkownik podał URL https://meal-adapt-staging.appsd.workers.dev i potwierdził poprawienie ustawień Supabase. Odczyt /auth/v1/settings potwierdził HTTP 200, emailEnabled=true, mailerAutoconfirm=true, signupDisabled=false.
- HTTP: strona główna, signin, signup, strona sukcesu rejestracji i zbudowany asset CSS zwracają 200; anonimowy dashboard przekierowuje 302 do /auth/signin. Brak komunikatu o nieskonfigurowanym Supabase.
- Pierwszy smoke zakończył się exit 0: wszystkie osiem kroków przeszło, w tym rejestracja, błędne hasło, poprawne logowanie, dashboard i wylogowanie.
- Rollback stagingu do c96fb814-b3ec-4d8f-ab0d-a9a79d192be8 zakończył się exit 0. Publiczny URL zwrócił HTTP 503 i dokładnie „Wdrożenie w przygotowaniu”. Nie pojawiło się żądanie potwierdzenia różnic sekretów.
- Przywrócono tę samą wersję aplikacji 697c2b61-8d99-4114-b865-18adb9b003fc przez versions deploy na 100% ruchu. CLI zakończyło się sukcesem. Nowy deployment ID: be9c8208-e570-4771-810d-cfa2e2782cee; created_on 2026-10-09T21:57:12.631198Z. Odczyt API potwierdził aktywną wersję.
- Powtórny smoke po przywróceniu również zakończył się exit 0 ze wszystkimi ośmioma krokami PASS; końcowa strona główna zwraca 200. Dwa wywołania smoke utworzyły dwa konta testowe w skonfigurowanym Supabase staging; pozostają w projekcie, zgodnie z planem.
- Próba obserwacji: scoped API utworzyło sesję tail (HTTP 200), po smoke sesję zamknięto; nie otrzymano zdarzeń. GraphQL Workers Metrics zwrócił HTTP 200 i pustą tablicę metryk. Nie wyprowadzamy z pustych wyników wniosku o braku błędów ani prawidłowym CPU. Konfiguracja Workera potwierdza observability=true, sampling=1 i invocation_logs=true. Zapisano tylko wybrane pola telemetrii, bez cookies, haseł i tokenów.
- Próba testu przeglądarkowego: narzędzie computer-use nie ma dostępnego IAB, a lista przeglądarek jest pusta. Formularze na desktopie i telefonie nie zostały zweryfikowane przez UI; kontrola HTTP nie zastępuje tej części odbioru.
- Wyniki zapisano w context/deployment/staging-verification.json. Manifest źródeł nadal pasuje. Produkcji nie publikowano. Staging ma potwierdzone auth przez HTTP i rollback, ale bramki przed produkcją nadal obejmują odczyt CPU/logów, test formularzy w przeglądarce/na telefonie i potwierdzenie Supabase Site URL.

### Ocena zgłoszeń audit przed API wykluczeń — 2026-10-20

Ponowna ocena wymagana przed rozszerzeniem serwera o nowe API (warunek z oceny 2026-10-09). Ocena statyczna kodu i lokalnego production bundle; nie jest testem penetracyjnym. Nie uruchomiono `npm audit fix`, lockfile i wersje zależności bez zmian.

- `npm audit --omit=dev`: 10 zgłoszeń (2 moderate, 8 high), exit 1 — ta sama lista co 2026-10-09: @cloudflare/vite-plugin, devalue, fast-uri, http-cache-semantics, miniflare, sharp, smol-toml, source-map-js, undici, wrangler. Zainstalowany devalue nadal 5.9.2.
- Nowe endpointy `GET`/`POST /api/exclusions` i `DELETE /api/exclusions/[productId]` są zwykłymi trasami API: zwracają `Response` z `JSON.stringify` (lub pustą 204), a ciało `POST` czytają przez `request.json()` i walidują zod. Nie definiują Astro Actions (brak `src/actions`, brak importu `astro:actions`) i nie wywołują `devalue`, `uneval` ani `stringify`/`parse` z devalue w ścieżce żądania. Chunki tras w buildzie (`exclusions_*.mjs`, `_productId_*.mjs`) nie zawierają odwołań do devalue/uneval; importują tylko serwis, klienta Supabase i wspólny runtime Astro, w którym devalue obsługuje Actions/server islands, nieużywane przez aplikację. Astro sessions nadal wyłączone.
- Pozostałe zgłoszenia (http-cache-semantics, sharp, smol-toml, source-map-js, undici, Miniflare/Wrangler/Vite plugin) dotyczą builda i narzędzi lokalnych/deploy; nowe API nie dodaje ich użycia w Workerze. Odpowiedzi API mają `Cache-Control: no-store`, więc nie tworzą współdzielonego cache odpowiedzi użytkownika.
- Wniosek: nie wykazano osiągalnej ścieżki powyższych zgłoszeń przez nowe API wykluczeń. Raport npm nie jest wyczyszczony; nie przedstawiać tego jako usunięcia podatności. Kontrolowana aktualizacja zależności (w tym devalue ≥ 5.9.3) pozostaje do zaplanowania; ocenę powtórzyć przed dodaniem Actions albo serializacji devalue.
