---
project: MealAdapt
researched_at: 2026-10-08
recommended_platform: Cloudflare Workers
runner_up: Netlify
context_type: mvp
tech_stack:
  language: TypeScript 6.0.3
  framework: Astro 7.3.2 / React 19.2.6
  runtime: Cloudflare Workers (workerd); Node.js 22.23.3 for tooling
---

## Recommendation

**Deploy on Cloudflare Workers, with external Supabase.**

Workers najlepiej odpowiada priorytetowi minimalnego kosztu i obecnemu starterowi: nie wymaga migracji adaptera, zapewnia zarządzany runtime i pełną obsługę przez CLI. Przy 10–100 tys. żądań miesięcznie hosting może kosztować $0, jeśli każde wywołanie mieści się w limicie Free; po przekroczeniu możliwości darmowego CPU punktem odniesienia jest Workers Paid od $5/mies. To koszt hostingu, bez Supabase, dostawcy AI, SMTP i domeny. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

Użytkownik **zaakceptował Cloudflare Workers po wszystkich trzech analizach ryzyka** 2026-10-08. Netlify pozostaje runner-up, Vercel trzecią opcją. Decyzja potwierdza `deployment_target: cloudflare-workers` w tech-stack.md. Ten dokument zapisuje wybór infrastruktury; pierwsze wdrożenie i jego konfiguracja wymagają osobnego zaakceptowanego planu.

### Context and interview

- Stack wejściowy: `context/foundation/tech-stack.md`; produkt: `context/foundation/prd.md`; ocena: `.claude/skills/10x-infra-research/references/agent-friendly-criteria.md`.
- MVP: twórca i kilka osób; trzy tygodnie pracy po godzinach, termin 2026-11-04. Brak ilościowego QPS, wolumenu danych i celu uptime. Widoczny stan przetwarzania po 2 sekundach nie oznacza obowiązku zakończenia odpowiedzi w 2 sekundy.
- Stałe połączenia/procesy: **nie**. Priorytet: **minimalny koszt**. Znajomość platform: **żadna**. Zasięg: **jeden kraj**. Usługi zewnętrzne: **Supabase zaakceptowany**.
- Wersje potwierdzone w lockfile i lokalnych pakietach: Astro 7.3.2, React 19.2.6, TypeScript 6.0.3, `@astrojs/cloudflare` 14.3.1, Wrangler 4.131.1, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.116.0. Node w .nvmrc: 22.14.0.
- Nie wybrano jeszcze modelu AI ani zmierzonych czasów generowania. Koszty AI i wpływ oczekiwania na rozliczenie funkcji pozostają otwarte.
- Korekta po instalacji zależności podczas pierwszego wdrożenia (2026-10-08): .nvmrc wskazuje teraz Node 22.23.3; pierwotne 22.14.0 nie spełnia engines wszystkich pakietów z lockfile. Wersje paczek i runtime Workers pozostają bez zmian.

## Platform Comparison

### Compatibility and hard filters

Cloudflare **Workers** uruchamia obecny bundle. Cloudflare **Pages SSR jest wykluczone**: wsparcie Pages usunięto z adaptera w v13, a repo używa v14.3.1. Node.js w .nvmrc jest runtime narzędzi, nie serwera produkcyjnego. [Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

Pozostałe platformy obsługują TypeScript, Astro SSR, React oraz Supabase, ale **nie uruchomią obecnego bundle workerd**. Są warunkowymi alternatywami po zmianie adaptera i kontraktu runtime: Vercel 11.0.12 deklaruje Astro ^7.0.0, Netlify 8.2.9 Astro ^7.0.0, Node 11.1.7 Astro ^7.2.1. To dowód zgodności deklarowanej przez upstream, nie test wdrożenia ani weryfikacja publikacji pakietu. Kod aplikacji nie wykazuje obecnie wyłącznych API Cloudflare; ewentualny wybór innej platformy wymagałby aktualizacji tech-stack.md i sprawdzenia adaptera przed implementacją. Jeśli nie wolno zmienić runtime/adaptera, jedynym bezpośrednio zgodnym finalistą jest Workers. [Vercel manifest](https://raw.githubusercontent.com/withastro/astro/main/packages/integrations/vercel/package.json), [Netlify manifest](https://raw.githubusercontent.com/withastro/astro/main/packages/integrations/netlify/package.json), [Node manifest](https://raw.githubusercontent.com/withastro/astro/main/packages/integrations/node/package.json)

Brak wymagań stałych procesów oznacza, że filtr persistent connections nie eliminuje serverless.

### Scoring matrix

Pass = 2, Partial = 1, Fail = 0. Wagi: CLI 3, managed 3, docs 2, deploy API 3, integration 1; maksimum 24. Korekty są jawną oceną dopasowania do tego MVP, nie miarą jakości dostawcy. Brak bonusu za znajomość, zasięg globalny lub co-location. Remis Netlify/Vercel rozstrzyga ograniczenie Hobby do zastosowań niekomercyjnych.

| Platform | CLI-first | Managed/serverless | Agent-readable docs | Stable deploy API | MCP / integration | Weighted base /24 | MVP penalty | Total |
|---|---|---|---|---|---|---:|---:|---:|
| Cloudflare Workers | Pass | Pass | Pass | Pass | Pass | 24 | −1 | **23** |
| Netlify | Pass | Pass | Pass | Pass | Pass | 24 | −3 | **21** |
| Vercel | Pass | Pass | Pass | Pass | Pass | 24 | −3 | **21** |
| Render | Pass | Pass | Pass | Pass | Pass | 24 | −5 | **19** |
| Railway | Partial | Pass | Pass | Pass | Pass | 21 | −4 | **17** |
| Fly.io | Pass | Partial | Pass | Pass | Partial | 20 | −4 | **16** |

Korekty: Workers −1 za niezweryfikowany limit CPU Free; Netlify −2 za kredyty + −1 za migrację; Vercel −2 za ograniczenie Hobby/komercyjny koszt + −1 za migrację; Render −4 za usypianie i ryzyko darmowego ruchu wychodzącego + −1 za migrację; Railway −3 za bazowy koszt/krótką retencję rollbacku + −1 za migrację; Fly −3 za płatny start i obsługę maszyny + −1 za migrację.

**Cloudflare Workers:** Wrangler obejmuje deploy, wersje, rollback i logi; runtime i routing są zarządzane. Dokumentacja ma markdown/llms.txt, a oficjalny API MCP zapewnia integrację agentową. Workers nie jest pełnym Node.js; Supabase przez HTTP pasuje do tego ograniczenia. D1, KV, R2 i Queues są opcjonalnymi usługami dostawcy, nie zastępują wybranego Supabase. Dla tego projektu nie potrzeba procesów persistent ani dodatkowych baz Cloudflare. Stare serwery MCP Observability, Workers Bindings i Workers Builds są **deprecated**, stan sprawdzony 2026-10-08; aktualną opcją jest API MCP/Code Mode, a start operacyjny opiera się na CLI. [Docs index](https://developers.cloudflare.com/workers/llms.txt), [MCP status](https://github.com/cloudflare/mcp-server-cloudflare), [API MCP](https://github.com/cloudflare/mcp)

**Netlify:** CLI, immutable deploys/API rollback, zarządzane Functions, markdown docs i oficjalny MCP uzasadniają pięć Pass. `netlify deploy` tworzy draft, `--prod` publikuje produkcję, `netlify logs --json --follow` daje logi. Functions nie są stale działającym procesem; background functions mają ograniczony czas. Dostawca oferuje Database i Blobs, ale pozostajemy przy Supabase. Największa luka względem Workers to migracja adaptera i kredyty naliczane również za produkcyjne wdrożenia. [CLI deploy](https://cli.netlify.com/commands/deploy/), [Logs](https://cli.netlify.com/commands/logs/), [Deploy management](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/), [AI integrations](https://docs.netlify.com/build/build-with-ai/agent-setup-guides/agent-setup-overview/), [Database](https://www.netlify.com/blog/netlify-database/)

**Vercel:** CLI, stabilne API, zarządzane Node Functions, llms.txt i oficjalny OAuth MCP dają pięć Pass. `vercel deploy --yes` tworzy preview, `--prod --yes` produkcję; rollback i `vercel logs --environment production --json` są dostępne przez CLI. Hobby dopuszcza wyłącznie zastosowania osobiste niekomercyjne; jego rollback obejmuje poprzednie wdrożenie produkcyjne. Storage obejmuje Blob i integracje baz z marketplace. WebSockets są **public beta**, a Queues **beta**, sprawdzono 2026-10-08; MVP nie zależy od tych funkcji. Nie traktujemy beta WebSockets jako zawsze działającego workera. [CLI](https://vercel.com/docs/cli/deploy), [Logs](https://vercel.com/docs/cli/logs), [Rollback](https://vercel.com/docs/instant-rollback), [MCP](https://vercel.com/docs/agent-resources/vercel-mcp), [Docs index](https://vercel.com/llms.txt), [WebSockets](https://vercel.com/docs/functions/websockets)

**Render:** Node web service z adapterem Node, zarządzane TLS/runtime, markdown/llms.txt, CLI/API i oficjalny infrastrukturalny MCP dają Pass. `render deploys create <SERVICE_ID> --wait --confirm -o json` pozwala sprawdzić sukces; `render logs --resources <SERVICE_ID> --tail -o json` odczytuje logi. Rollback artefaktu używa panelu albo REST API; deployment starego SHA oznacza rebuild. Dostępne są PostgreSQL i Key Value, web service obsługuje WebSockets/procesy persistent. Darmowy plan usypia serwer i może zawiesić duży ruch do zewnętrznych DB/API; to zły kompromis dla Supabase i AI. Osobny MCP zapytań do dokumentacji jest **experimental**, sprawdzono 2026-10-08; nie jest potrzebny do operacji infrastruktury. [Astro](https://render.com/docs/deploy-astro), [CLI](https://render.com/docs/cli-reference), [Rollback](https://render.com/docs/rollbacks), [Agent docs](https://render.com/docs/llm-support), [Infrastructure MCP](https://render.com/docs/mcp-server)

**Railway:** Zarządzany Node/container, markdown docs, deploy API i oficjalny MCP dają Pass. CLI jest Partial: `railway up` i `railway logs --lines 100 --json` są użyteczne, ale `railway redeploy` nie jest rollbackiem do dowolnego starego obrazu; historyczny rollback wymaga panelu w opisanym workflow. Retencja obrazu wynosi 24 h Free/Trial i 72 h Hobby. PostgreSQL/Redis, volumes i buckets umożliwiają co-location, lecz nie dają korzyści przy zaakceptowanym Supabase. Persistent procesy nie są potrzebne. MCP nie ma oznaczenia beta w sprawdzonej dokumentacji; nie wyprowadzamy z tego gwarancji GA, a hosted default wymaga CLI 5.44.0+. [CLI](https://docs.railway.com/cli), [Rollback](https://docs.railway.com/guides/roll-back-bad-deploy), [MCP](https://docs.railway.com/ai/mcp-server), [Docs index](https://docs.railway.com/llms.txt)

**Fly.io:** `fly deploy`, `fly releases --image --json`, `fly deploy --image <REFERENCE>` oraz `fly logs --json --no-tail` dają mocne CLI/API; docs mają llms.txt. Managed jest Partial względem serverless: trzeba dobrać maszyny, zasoby i auto-stop. Integracja jest Partial: agentowe Sprites są odrębnym produktem, a hosting MCP nie dowodzi ogólnego MCP do zarządzania Machines. `fly mcp` transport workflow jest **beta**, sprawdzono 2026-10-08, poza zależnościami MVP. Platforma wspiera persistent procesy, managed Postgres, volumes i Tigris; nie wykorzystujemy tych przewag. Brak stałego darmowego planu i migracja adaptera obniżają dopasowanie. [Astro](https://docs.astro.build/en/guides/deploy/flyio/), [Deploy](https://docs.fly.io/flyctl/cmd/fly_deploy), [Logs](https://docs.fly.io/flyctl/cmd/fly_logs), [Agent integration](https://fly.io/ai-agents/), [MCP beta](https://www.fly.io/docs/mcp/transports/stdio/)

### Cost scenarios

USD/miesiąc, bez podatków, AI, Supabase, SMTP, domeny i opcjonalnych usług. Scenariusz porównawczy, nie prognoza PRD: 10 lub 100 tys. żądań, po 100 KB odpowiedzi, czyli około 1 lub 10 GB transferu; 10 produkcyjnych publikacji. Dla Functions założono 1 GB pamięci i 100 ms czasu wywołania. Generowanie AI może trwać znacznie dłużej, zwiększając rozliczany czas funkcji; wymaga oddzielnego pomiaru.

| Platform | 10k requests | 100k requests | Condition |
|---|---:|---:|---|
| Workers Free | $0 | $0 | ≤100k/dzień na konto i 10 ms CPU/wywołanie; brak płatnych dodatków |
| Workers Paid | od $5 | od $5 | 10 mln żądań i 30 mln CPU-ms w bazowym pakiecie |
| Netlify | $0 | $9 Personal | około 175 / 398 kredytów; Free 300, Personal 1000 |
| Vercel Hobby | $0 | $0 | projekt niekomercyjny; CPU, memory i transfer w limitach |
| Vercel Pro | od $20 | od $20 | komercyjny wariant; zużycie i dodatki mogą zwiększyć koszt |
| Render Free | $0 warunkowo | $0 warunkowo | limity workspace, usypianie, ryzyko zawieszenia outbound; paid od około $7 |
| Railway Hobby | $5 | $5 | model zużycia około $2.55 / $3.01 mieści się w $5; większe zasoby zwiększą koszt |
| Fly.io | cena VM + ~$0.02 transferu EU | cena VM + ~$0.20 transferu EU | mała VM 256 MB od $2.19, 512 MB od $3.69 w najtańszych USA; region EU wyceniany osobno |

Netlify: 15 kredytów za production deploy, 20/GB transferu, 2/10k żądań i 10/GB-hour Functions; Free ma twardy limit. Vercel Hobby obejmuje m.in. 1 mln function invocations, 4 CPU-hours, 360 GB-hours i 100 GB transferu. Railway Free ma $1 miesięcznego kredytu, trial jednorazowo $5; nie zakładamy, że wystarczy to na stale działający SSR. Fly trial kończy się po 2 godzinach VM lub 7 dniach. Render Free ma 750 godzin wspólnie dla workspace i około minutowy start po 15 minutach bezczynności. [Netlify pricing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel Pro](https://vercel.com/docs/plans/pro-plan), [Railway pricing](https://docs.railway.com/pricing/plans), [Fly pricing](https://docs.fly.io/about/pricing), [Fly trial](https://docs.fly.io/about/free-trial), [Render Free](https://render.com/docs/free), [Render paid baseline](https://render.com/articles/production-rails-hosting-guide)

Supabase Free: $0, 500 MB bazy i 5 GB egress; pauzowanie po tygodniu nieaktywności i maksymalnie dwa aktywne projekty. Pro zaczyna się od $25/mies. Wybór hostingu nie znosi tych limitów. [Supabase pricing](https://supabase.com/pricing)

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Najwyższy wynik po uwzględnieniu kosztu i ryzyka: aktualny adapter, brak kosztu utrzymywania idle serwera, dobre CLI i dokumentacja. Globalny edge nie jest argumentem rozstrzygającym dla jednego kraju. Warunkiem startu na Free jest pomiar CPU pełnego przepływu; plan Paid jest rezerwą, nie zaakceptowanym automatycznie wydatkiem.

#### 2. Netlify

Darmowy start i dobre preview/CLI/MCP, bez ograniczenia Hobby znanego z Vercel. Wymaga adaptera Netlify i aktualizacji kontraktu runtime. Free może wyczerpać się przez częste publikacje lub długie funkcje AI nawet przy małej liczbie użytkowników.

#### 3. Vercel

Dobry wariant dla osobistego niekomercyjnego MVP, z bardzo wygodnym preview i zarządzanymi funkcjami. Nie daje kosztowej przewagi nad Workers, wymaga zmiany adaptera, a ewentualne użycie komercyjne zmienia bazowy budżet. Zastosowanie komercyjne projektu nie zostało zadeklarowane.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **CPU Free może być za małe dla rzeczywistego przepływu.** SSR, JSON parsing i deterministyczna walidacja trzech propozycji mogą przekroczyć 10 ms; liczba użytkowników nie chroni przed limitem. Potrzebny pomiar, a przy przekroczeniu optymalizacja albo świadomy wybór Paid. Oczekiwanie na sieć nie zużywa CPU. [Limits](https://developers.cloudflare.com/workers/platform/limits/)
2. **Zależności Node mogą nie działać w workerd.** `nodejs_compat` nie daje całego Node; dobór SDK AI i bibliotek musi uwzględniać runtime, nie tylko lokalną wersję Node. [Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
3. **Version URL może dotknąć produkcyjnych danych i utrudnić diagnozę.** Nie tworzy osobnego środowiska i nie udostępnia logów przez tail/Workers Logs/Logpush. Dla testów auth i zapisów potrzebny jest oddzielny Worker staging oraz oddzielny Supabase. [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)
4. **Rollback aplikacji nie odtwarza bazy.** Cofnięty kod może nie pasować do nowego schematu; migracje muszą zachować zgodność z poprzednią wersją. [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

### Pre-Mortem — How This Could Fail

Poniższy scenariusz jest hipotezą analityczną, nie opisem zdarzenia.

Po sześciu miesiącach MealAdapt działał tylko sporadycznie, choć pierwsze wdrożenie wyglądało dobrze. Twórca założył, że kilku użytkowników oznacza brak ograniczeń darmowego hostingu. Testował logowanie i prostą stronę, lecz nie zmierzył czasu CPU pełnego SSR z parsowaniem odpowiedzi AI i walidacją trzech propozycji. Podczas rzeczywistego użycia pojawiły się błędy limitu zasobów. Szybkie ponawianie żądań nie naprawiało problemu, za to zwiększało rachunek dostawcy modeli, ponieważ kolejne próby rozpoczynały nowe generowanie.

Do testowania poprawek używano adresów wersji tego samego Workera, uznając je za osobne środowisko. Nadal korzystały z produkcyjnego Supabase i danych prawdziwych użytkowników. Brak logów dla tych adresów utrudniał znalezienie przyczyny. Przy zmianie konfiguracji ktoś wykonał polecenie dodania sekretu, nie wiedząc, że od razu publikuje nową wersję. Cofnięcie kodu nie cofnęło migracji bazy.

Po tygodniowej przerwie darmowy projekt Supabase został wstrzymany. Zaproszone osoby nie mogły odzyskać hasła, bo domyślny SMTP obsługiwał tylko adresy zespołu. Zamiast planowanych trzech tygodni pracy powstało kilka tygodni doraźnych napraw. Problemem okazały się nie skala ani wybór edge, lecz brak pomiaru całego przepływu, izolowanego stagingu i sprawdzonej konfiguracji poczty.

### Unknown Unknowns

- **Workflow wersji adaptera:** v14.3.1 używa Cloudflare Vite plugin, `astro dev` i `astro preview` działają w workerd, a entrypoint to `@astrojs/cloudflare/entrypoints/server`. `Astro.locals.runtime` i Pages SSR należą do usuniętych rozwiązań; używać `astro:env/server` dla zadeklarowanych sekretów, a `cloudflare:workers` dla potrzebnych bindingów. Potwierdzono w lokalnym kodzie 14.3.1 i dokumentacji migracji. [Exact adapter source](https://raw.githubusercontent.com/withastro/astro/@astrojs/cloudflare@14.3.1/packages/integrations/cloudflare/src/index.ts)
- **Sekret może być publikacją:** `wrangler secret put` od razu wdraża nową wersję; `wrangler versions secret put` tylko przygotowuje wersję. Zmiana sekretu podlega tym samym granicom co zmiana aplikacji. [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- **Darmowy Supabase nie zapewnia gotowej poczty dla użytkowników:** built-in SMTP wysyła tylko na adresy zespołu i ma limit 2 wiadomości/h. Rejestracja i odzyskiwanie hasła wymagają własnego SMTP, konfiguracji redirect URLs i weryfikacji dostarczenia. [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- **Domyślne usługi adaptera mogą rozszerzać koszt/uprawnienia:** adapter 14.3.1 domyślnie obsługuje Images binding i Astro sessions/KV, gdy są potrzebne. Supabase auth cookies nie oznaczają używania Astro sessions. Przed publikacją sprawdzić wynikowy config/bindings; MVP nie wymaga optymalizacji obrazów ani dodatkowego session store. [Adapter source](https://raw.githubusercontent.com/withastro/astro/@astrojs/cloudflare@14.3.1/packages/integrations/cloudflare/src/index.ts)

## Operational Story

- **Preview deploys:** dla gałęzi/PR docelowo upload wersji `npx wrangler versions upload --preview-alias pr-123`; URL wersji jest publiczny, jeśli go nie zabezpieczymy Access. Mechanizm nie powstaje automatycznie z obecnego CI. Do diagnozy i testów zapisu używać osobnego Workera `meal-adapt-staging` z testowym Supabase; Version URL nie izoluje zasobów i nie ma wskazanych wyżej logów. Fork PR nie otrzymuje tokenów ani produkcyjnych sekretów. Integracja CI i Access będzie opisana w planie. [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)
- **Secrets:** `SUPABASE_URL`, `SUPABASE_KEY` oraz późniejszy klucz AI w Worker Secrets, lokalnie w gitignored .dev.vars. SUPABASE_KEY ma być anon/publishable do przepływu użytkownika, nie service_role omijający RLS. Token deploy trzymać w env/GitHub Secrets. Po utworzeniu Workera użyć account-owned token Editor dla konkretnego Workera; logi przez Metadata Read-Only. Utworzenie nowego Workera wymaga szerszego Workers Admin, więc bootstrap wykona właściciel w zaakceptowanym planie, bez stałego nadawania Admin agentowi. Wartości Worker Secrets są ukryte w panelu/CLI po zapisaniu, ale kod Workera może je odczytać; uprawnienie deploy wymaga zaufania. Rotację głównego sekretu wykonuje człowiek. [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [Authorization](https://developers.cloudflare.com/workers/authorization/)
- **Rollback:** `npx wrangler deployments list --name meal-adapt --json` i `npx wrangler rollback <VERSION_ID> --name meal-adapt --yes`. Cel operacyjny: kilka minut wraz z testem logowania i głównego przepływu; nie jest to SLA ani zmierzony czas. Cofnięcie wersji nie cofa danych ani migracji Supabase; sprawdzić również zgodność jej bindingów i sekretów. [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
- **Approval:** agent może samodzielnie robić research, lokalne kontrole i odczyt logów; staging wyłącznie w zaakceptowanym zakresie planu. Pierwsza publikacja produkcyjna wymaga ludzkiej akceptacji planu w `context/deployment/deploy-plan.md`. Upstream preferuje potem auto-deploy po merge: zatwierdzony merge może być bramką publikacji dopiero po świadomym skonfigurowaniu takiej automatyzacji. Zmiana planu billing wymaga decyzji użytkownika. Usunięcie projektu/bazy i rotacja głównego sekretu pozostają czynnościami człowieka.
- **Logs:** runtime staging/production przez `npx wrangler tail meal-adapt --format json` albo `npx wrangler tail meal-adapt-staging --format json`, z tokenem read-only; historia przez Workers Logs lub odczyt API. Observability jest już w wrangler.jsonc. Retencja Workers Logs Free wynosi 3 dni, Paid 7 dni; nie logować tokenów, haseł ani treści wykluczeń/przepisów. CI GitHub Actions odczytywać przez `gh run list` i `gh run view <RUN_ID> --log-failed`. Obecny workflow tylko lint/check/build/smoke, bez deploy; nie ma jeszcze wykonanych wdrożeń, których logi można potwierdzić. [Realtime logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/), [Log pricing](https://developers.cloudflare.com/workers/platform/pricing/)

## Risk Register

L/M/H = low/medium/high. Oceny prawdopodobieństwa są jakościowe przy małym MVP, nie pomiarami.

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| SSR/walidacja przekraczają 10 ms CPU Free | Devil's advocate | M | H | Zmierzyć pełny przepływ trzech propozycji w staging; decyzja Free/Paid na podstawie CPU, bez samoczynnego upgrade |
| SDK/zależność wymaga pełnego Node | Devil's advocate | M | H | Sprawdzać SDK AI w astro dev i build/preview workerd przed dodaniem |
| Preview współdzieli produkcyjne dane i nie ma logów | Devil's advocate | M | H | Osobny staging Worker i Supabase; testować zapis wyłącznie na danych testowych |
| Rollback kodu nie pasuje do migracji DB | Devil's advocate | M | H | Migracje addytywne; zachować kompatybilność poprzedniej wersji i sprawdzić rollback przed zmianą destrukcyjną |
| Ponowienia generowania zwiększają rachunek AI | Pre-mortem | M | H | Limit max 3 propozycji zgodny z PRD; limit długości/czasu, rate limit per użytkownik, zakaz automatycznych pełnych retry bez kontroli budżetu |
| Supabase Free pauzuje po nieaktywności; brak automatycznego backupu Free | Research finding | M | H | Przed demo sprawdzić stan projektu; regularny eksport danych i próba odtworzenia; świadoma decyzja Pro przy wymaganiu braku pauzy |
| Stary poradnik sugeruje Pages/legacy runtime | Unknown unknowns | M | M | Zachować adapter 14.3.1 i lockfile; Workers deploy, npm run dev/preview; nie stosować Pages CLI |
| secret put publikuje bez oczekiwanej bramki | Unknown unknowns | M | H | Przygotowywać przez versions secret put lub upload wersji; jawna akceptacja publikacji; główną rotację wykonuje człowiek |
| Brak rejestracji/resetu hasła dla zwykłych użytkowników | Unknown unknowns | H | H | Własny SMTP, test z adresem spoza zespołu, poprawne Site URL i callback/odzyskiwanie przed udostępnieniem |
| Niezamierzone Images/KV lub prawa bootstrap Admin | Unknown unknowns | M | M | Sprawdzić wynikowy config i używane funkcje; właściciel tworzy zasoby, później token Worker Editor |
| Zbyt szerokie prawa / RLS omijane przez service_role | Research finding | M | H | Token scoped do Workera, osobny read-only do logów; anon/publishable Supabase + RLS, bez service_role w przepływie użytkownika |
| Przestarzały operacyjny MCP | Research finding | M | M | Workers Bindings/Builds/Observability MCP deprecated (2026-10-08); zacząć od CLI, ewentualnie aktualny API MCP |

Dowody dla ryzyk Supabase: [production guidance](https://supabase.com/docs/guides/deployment/going-into-prod), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp). Uprawnienia: [Workers roles](https://developers.cloudflare.com/workers/authorization/workers/). Pozostałe odsyłacze znajdują się przy odpowiadających im analizach.

## Getting Started

Poniższe komendy są wskazówkami do osobnego planu wdrożenia, a nie raportem wykonanych działań. Zweryfikowano lokalny kod `@astrojs/cloudflare@14.3.1`, peer dependencies Astro ^7.2.0/Wrangler ^4.125.0 i `--help` zainstalowanego Wrangler 4.131.1 dla deploy, versions upload, versions secret put, versions deploy, rollback, tail i deployments list. Nie zastępować ich narzędziami latest.

1. **Przygotować plan i konta:** w Plan Mode odczytać ten dokument razem z tech-stack.md, zapisać zaakceptowany zakres do `context/deployment/deploy-plan.md`. Właściciel przygotowuje Cloudflare, Supabase w odpowiednim regionie, testowy projekt i SMTP. W repo zmienić nazwę Workera ze starterowego `10x-astro-starter` na `meal-adapt` dopiero w realizacji planu; zaplanować osobny staging. Nie inicjalizować od nowa istniejącego startera.
2. **Zachować wersje i lokalny runtime:** `nvm use`, `npm ci`, lokalne sekrety w .dev.vars, potem `npm run dev`. Wymagany pin to Node 22.23.3: instalacja wykazała, że starterowe 22.14.0 nie spełnia engines wszystkich pakietów z lockfile. Dev już uruchamia workerd. Nie dokładać osobnego `wrangler dev`.
3. **Zweryfikować artefakt:** `npm run build`, `npm run preview` oraz `npx wrangler deploy --dry-run`. Dry run nie publikuje. Sprawdzić auth/RLS, CPU oraz zgodność Images/KV; zachować entrypoint `@astrojs/cloudflare/entrypoints/server`. Dla nowego resetu hasła trzeba najpierw zaimplementować przepływ z PRD, bo starter zapewnia tylko podstawowe auth.
4. **Przygotować środowisko i sekrety:** po utworzeniu Workera przez właściciela, ustawić scoped token w env; `npx wrangler versions secret put SUPABASE_URL` i `npx wrangler versions secret put SUPABASE_KEY` przygotowują wersje bez publikacji. Dla spójnej wersji kodu i sekretów Wrangler 4.131.1 obsługuje `npx wrangler versions upload --secrets-file <GITIGNORED_SECRETS_FILE> --preview-alias review`. Testy zapisu wykonać na odrębnym stagingu. Głównej rotacji nie wykonuje agent.
5. **Opublikować dopiero w zatwierdzonym zakresie:** dla już wgranego, sprawdzonego version ID komenda to `npx wrangler versions deploy <VERSION_ID>@100% --yes`; dla zwykłego pierwszego publish po konfiguracji `npx wrangler deploy`. Wybrać w planie jeden właściwy wariant. To Workers commands; `wrangler pages deploy` nie pasuje do tego adaptera. Następnie sprawdzić rejestrację, logowanie, reset hasła, izolację właścicieli, główny przepływ AI oraz procedurę rollbacku.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration.
- CI/CD pipeline setup — istniejący workflow został tylko odczytany, nie skonfigurowano publikacji.
- Production-scale architecture: multi-region, HA, DR.
- Wybór modelu i dostawcy AI, dostawcy SMTP oraz domeny; ich koszty wymagają osobnej decyzji.

