---
bootstrapped_at: 2026-10-08T11:32:13.184666Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: meal-adapt
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

---
starter_id: 10x-astro-starter
package_manager: npm
project_name: meal-adapt
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-workers
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: true
  has_background_jobs: false
---

## Why this stack

MealAdapt to aplikacja webowa dla twórcy i kilku osób, z MVP planowanym na trzy tygodnie pracy po godzinach. Użytkownik zaakceptował rekomendowany 10x Astro Starter: Astro, React, TypeScript, Tailwind CSS i Supabase. Jawne typy, konwencje projektu oraz przygotowana obsługa podstawowego logowania ograniczają koszt startu; Supabase zapewnia PostgreSQL do przechowywania wykluczeń i zapisanych przepisów. Integracja AI, deterministyczna walidacja składników, reguły zamian, odzyskiwanie hasła i kontrola dostępu do danych wymagają implementacji lub konfiguracji dla MealAdapt. Użytkownik potwierdził Cloudflare Workers zgodnie z [aktualną dokumentacją startera](https://github.com/przeprogramowani/10x-astro-starter#deployment), świadomie zastępując Cloudflare Pages wskazane w lokalnym rejestrze. Wybrano npm, nazwę meal-adapt oraz GitHub Actions z automatycznym wdrożeniem po merge do głównej gałęzi. Pewność przygotowania projektu wynosi first-class: starter ma zarejestrowane polecenie inicjalizacji, ale cały proces nie był zweryfikowany od początku do końca i może wymagać ręcznych kroków. MVP wymaga kont i AI; płatności, komunikacja realtime i zadania w tle nie są częścią ustalonego zakresu.

## Pre-scaffold verification

| Signal | Value | Severity | Notes |
| --- | --- | --- | --- |
| npm package | not run | n/a | Clone-based starter; no generator package in the command. |
| GitHub repo | przeprogramowani/10x-astro-starter last pushed 2026-09-12T21:16:08Z | fresh | `gh api repos/przeprogramowani/10x-astro-starter --jq '.pushed_at'`; within 3 months of 2026-10-08. |

The initial sandboxed GitHub request could not connect. Retried with approved network access and succeeded.
The hand-off explicitly records the user's Cloudflare Workers choice despite the registry's older Cloudflare Pages default; that choice was retained.

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone — clone into a temporary directory, remove upstream history, then move files into the current directory.
**Exit code**: 0
**Upstream commit**: `4c0b8a0aa09ad74eba612d5df9f3fbefdeb94fef`
**Files moved**: 51 project files, plus the installed `node_modules/` dependency tree.
**Conflicts (.scaffold siblings)**: AGENTS.md.scaffold
**.gitignore handling**: moved silently
**.bootstrap-scaffold cleanup**: deleted after successful merge; cloned `.git/` removed before move-up.
**Preservation**: SHA-256 verified all 7 pre-existing files (AGENTS.md and six context files) unchanged. Existing repository history retained.

The sandboxed clone initially failed with DNS resolution error (exit 128), before creating a scaffold. The same command was retried with approved network access and succeeded. No merge was performed on the failed attempt.

The starter's existing CLAUDE.md and GitHub Actions workflow were copied unchanged; no new agent instructions or CI/CD configuration was generated. Feature flags were recorded without implementing MealAdapt features. Package name remains the starter's `10x-astro-starter`, as the skill records project_name as metadata rather than rewriting starter files.

npm reported engine warnings for astro-eslint-parser@3.1.0 and eslint-plugin-astro@3.1.0: Node ^22.22.3, ^24.16.0 or >=26.3.0 required, while the active Node was v24.14.1. Installation completed. The starter's `.nvmrc` specifies 22.14.0, which also falls below these packages' current supported 22.x range.

**CLI stdout**

```text

added 656 packages, and audited 657 packages in 8s

233 packages are looking for funding
  run `npm fund` for details

12 vulnerabilities (2 moderate, 10 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

**CLI stderr**

```text
Cloning into '.bootstrap-scaffold'...
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'astro-eslint-parser@3.1.0',
npm warn EBADENGINE   required: { node: '^22.22.3 || ^24.16.0 || >=26.3.0' },
npm warn EBADENGINE   current: { node: 'v24.14.1', npm: '11.11.0' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'eslint-plugin-astro@3.1.0',
npm warn EBADENGINE   required: { node: '^22.22.3 || ^24.16.0 || >=26.3.0' },
npm warn EBADENGINE   current: { node: 'v24.14.1', npm: '11.11.0' }
npm warn EBADENGINE }
```

### File-by-file move log

| Path | Action |
| --- | --- |
| `.env.example` | moved |
| `.github/workflows/ci.yml` | moved |
| `.gitignore` | moved |
| `.husky/pre-commit` | moved |
| `.nvmrc` | moved |
| `.prettierrc.json` | moved |
| `.vscode/settings.json` | moved |
| `.vscode/extensions.json` | moved |
| `.vscode/launch.json` | moved |
| `AGENTS.md` | sidelined |
| `CLAUDE.md` | moved |
| `README.md` | moved |
| `astro.config.mjs` | moved |
| `components.json` | moved |
| `eslint.config.js` | moved |
| `node_modules/ (installed dependency tree)` | moved |
| `package-lock.json` | moved |
| `package.json` | moved |
| `public/favicon.png` | moved |
| `public/.assetsignore` | moved |
| `public/template.png` | moved |
| `scripts/smoke.mjs` | moved |
| `src/middleware.ts` | moved |
| `src/env.d.ts` | moved |
| `src/styles/global.css` | moved |
| `src/components/Welcome.astro` | moved |
| `src/components/Banner.astro` | moved |
| `src/components/Topbar.astro` | moved |
| `src/components/ui/LibBadge.astro` | moved |
| `src/components/ui/button.tsx` | moved |
| `src/components/auth/SubmitButton.tsx` | moved |
| `src/components/auth/SignInForm.tsx` | moved |
| `src/components/auth/FormField.tsx` | moved |
| `src/components/auth/PasswordToggle.tsx` | moved |
| `src/components/auth/ServerError.tsx` | moved |
| `src/components/auth/SignUpForm.tsx` | moved |
| `src/layouts/Layout.astro` | moved |
| `src/lib/utils.ts` | moved |
| `src/lib/config-status.ts` | moved |
| `src/lib/supabase.ts` | moved |
| `src/pages/dashboard.astro` | moved |
| `src/pages/index.astro` | moved |
| `src/pages/auth/confirm-email.astro` | moved |
| `src/pages/auth/signup.astro` | moved |
| `src/pages/auth/signin.astro` | moved |
| `src/pages/api/auth/signout.ts` | moved |
| `src/pages/api/auth/signin.ts` | moved |
| `src/pages/api/auth/signup.ts` | moved |
| `supabase/.gitignore` | moved |
| `supabase/config.toml` | moved |
| `tsconfig.json` | moved |
| `wrangler.jsonc` | moved |

### Additional validation

- `npx --no-install astro check`: exit 0; 29 files checked, 0 errors, 0 warnings, 0 hints.
- `npm run build`: exit 0; Cloudflare server build completed. Sitemap skipped because no `site` URL is configured.
- Initial sandboxed check and build attempts could not access Astro preferences; approved retries succeeded.
- Auth smoke test not run: Supabase credentials and a running Supabase service have not been configured.

**check stdout**

```text
▶ Astro collects anonymous usage data.
  This information helps us improve Astro.
  Run "astro telemetry disable" to opt-out.
  https://astro.build/telemetry

13:29:08 [@astrojs/cloudflare] Enabling image processing with Cloudflare Images for production with the "IMAGES" Images binding.
13:29:08 [@astrojs/cloudflare] Enabling sessions with Cloudflare KV with the "SESSION" KV binding.
13:29:09 [types] Generated 180ms
13:29:09 [check] Getting diagnostics for Astro files in /Users/dawidnowak/Projects/meal-adapt...
Result (29 files): 
- 0 errors
- 0 warnings
- 0 hints
```

**check stderr**

```text

```

**build stdout**

```text

> 10x-astro-starter@0.0.1 build
> astro build

13:31:00 [@astrojs/cloudflare] Enabling image processing with Cloudflare Images for production with the "IMAGES" Images binding.
13:31:00 [@astrojs/cloudflare] Enabling sessions with Cloudflare KV with the "SESSION" KV binding.
13:31:00 [types] Generated 20ms
13:31:00 [build] output: "server"
13:31:00 [build] mode: "server"
13:31:00 [build] directory: /Users/dawidnowak/Projects/meal-adapt/dist/
13:31:00 [build] adapter: @astrojs/cloudflare
13:31:00 [build] Collecting build info...
13:31:00 [build] ✓ Completed in 48ms.
13:31:00 [build] Building server entrypoints...
13:31:00 [vite] ✓ built in 109ms
13:31:00 [vite] ✓ built in 597ms
13:31:00 [vite] ✓ built in 105ms
13:31:00 [build] Rearranging server assets...
13:31:00 [build] ✓ Completed in 836ms.
13:31:00 [@astrojs/cloudflare] Injected immutable Cache-Control for /_astro/* into _headers.
13:31:00 [WARN] [@astrojs/sitemap] The Sitemap integration requires the `site` astro.config option. Skipping.
13:31:00 [build] Server built in 886ms
13:31:00 [build] Complete!
```

**build stderr**

```text

```

## Post-scaffold audit

**Tool**: `npm audit --json`
**Exit code**: 1 (findings present; audit completed successfully)
**Summary**: 0 CRITICAL, 10 HIGH, 2 MODERATE, 0 LOW, 0 INFO; 12 affected package entries.
**Direct vs transitive**: 0/2/0/0 direct of total 0/10/2/0 (CRITICAL/HIGH/MODERATE/LOW). Transitive: 0/8/2/0.

The current audit output does not provide metadata.dependencies.direct. Classification uses each vulnerability entry's isDirect flag. Counts refer to affected packages, including propagation through dependency chains, rather than unique advisories. No automatic fixes were run.

The initial audit request failed with sandbox DNS restrictions. The approved retry succeeded; full JSON follows the findings.

#### CRITICAL findings

None.

#### HIGH findings

- **@astrojs/cloudflare** — installed 14.3.1; direct; affected range `>=12.6.8`. npm fixAvailable: `{"name": "@astrojs/cloudflare", "version": "12.6.13", "isSemVerMajor": true}`.
  - Propagated from `@cloudflare/vite-plugin`.
  - Propagated from `wrangler`.
- **@cloudflare/vite-plugin** — installed 1.54.8; transitive; affected range `<=0.0.0-7ae5dd357 || >=1.2.3`. npm fixAvailable: `{"name": "@astrojs/cloudflare", "version": "12.6.13", "isSemVerMajor": true}`.
  - Propagated from `miniflare`.
  - Propagated from `wrangler`.
- **brace-expansion** — installed 1.1.18, 5.0.9; transitive; affected range `<=1.1.20 || 4.0.0 - 5.0.11`. npm fixAvailable: `true`.
  - Advisory 1240100: brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service — https://github.com/advisories/GHSA-q2hr-2g5m-vwhr; range `<1.1.21`.
  - Advisory 1240103: brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service — https://github.com/advisories/GHSA-q2hr-2g5m-vwhr; range `>=4.0.0 <5.0.12`.
  - Advisory 1240104: brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion — https://github.com/advisories/GHSA-qhr7-859c-m2p7; range `<1.1.20`.
  - Advisory 1240107: brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion — https://github.com/advisories/GHSA-qhr7-859c-m2p7; range `>=4.0.0 <5.0.11`.
  - Advisory 1240108: brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion — https://github.com/advisories/GHSA-6j4f-fj2g-mc7p; range `<1.1.19`.
  - Advisory 1240111: brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion — https://github.com/advisories/GHSA-6j4f-fj2g-mc7p; range `>=4.0.0 <5.0.10`.
- **devalue** — installed 5.9.2; transitive; affected range `<=5.9.2`. npm fixAvailable: `true`.
  - Advisory 1240870: devalue: `stringify`/`uneval` serialize shared memory — https://github.com/advisories/GHSA-j22f-vq7h-c4qm; range `>=5.1.0 <=5.9.2`.
  - Advisory 1240871: devalue: Residual sparse-array CPU amplification in uneval — https://github.com/advisories/GHSA-hx4r-w6wj-j8fg; range `<=5.9.2`.
  - Advisory 1240872: devalue: Repeated primitive strings cause quadratic expansion in uneval — https://github.com/advisories/GHSA-mcm9-63f2-9j32; range `<=5.9.2`.
  - Advisory 1240873: devalue: Sparse arrays emitted by uneval cause eager allocation when evaluated — https://github.com/advisories/GHSA-wf3x-273g-mvxv; range `>=1.0.0 <=5.9.2`.
  - Advisory 1240874: devalue: stringifyAsync can cause an unhandled rejection despite a caught returned promise — https://github.com/advisories/GHSA-x5rw-q4pp-hg5g; range `>=5.8.0 <=5.9.2`.
  - Advisory 1240875: devalue: Malformed null-prototype object keys bypass __proto__ rejection via property-key coercion — https://github.com/advisories/GHSA-4q55-j62x-fr9h; range `<=5.9.2`.
- **http-cache-semantics** — installed 4.2.0; transitive; affected range `<=4.2.0`. npm fixAvailable: `true`.
  - Advisory 1240991: http-cache-semantics max-stale handling can disclose cross-user cached responses — https://github.com/advisories/GHSA-ch52-4w7c-c8xp; range `<=4.2.0`.
- **miniflare** — installed 5.20260911.0-alpha; transitive; affected range `<=0.0.0-fec45ed61 || >=4.20250508.3`. npm fixAvailable: `{"name": "wrangler", "version": "4.15.2", "isSemVerMajor": true}`.
  - Propagated from `sharp`.
  - Propagated from `undici`.
- **sharp** — installed 0.35.4; transitive; affected range `<0.35.5`. npm fixAvailable: `{"name": "wrangler", "version": "4.15.2", "isSemVerMajor": true}`.
  - Advisory 1241331: sharp : Vulnerability in librsvg dependency CVE-2026-96889 — https://github.com/advisories/GHSA-wq5f-xc86-pv6w; range `<0.35.5`.
- **source-map-js** — installed 1.2.1; transitive; affected range `1.0.0 - 1.2.1`. npm fixAvailable: `true`.
  - Advisory 1241209: source-map-js allows event-loop denial of service through indexed source-map section offsets — https://github.com/advisories/GHSA-68fv-2mgg-jv7q; range `>=1.0.0 <1.2.2`.
- **undici** — installed 7.29.0, 8.10.2; transitive; affected range `7.0.0 - 7.29.0`. npm fixAvailable: `{"name": "wrangler", "version": "4.15.2", "isSemVerMajor": true}`.
  - Advisory 1239933: undici vulnerable to Denial of Service via unhandled error in WebSocket permessage-deflate decompression — https://github.com/advisories/GHSA-3wwx-pv8p-q78v; range `>=7.28.0 <7.29.1`.
  - Advisory 1240036: undici vulnerable to Denial of Service via orphaned RetryHandler response body — https://github.com/advisories/GHSA-pmjh-fq2x-6v4x; range `>=7.11.0 <7.29.1`.
  - Advisory 1240038: undici vulnerable to downstream response splitting via retry interceptor — https://github.com/advisories/GHSA-r53p-7pc4-xj5r; range `>=7.0.0 <7.29.1`.
  - Advisory 1240041: undici vulnerable to Denial of Service via unrequested WebSocket subprotocol — https://github.com/advisories/GHSA-rfgv-xxqx-mfg5; range `>=7.0.0 <7.29.1`.
  - Advisory 1240044: undici vulnerable to Denial of Service via unbounded decompression of compressed responses — https://github.com/advisories/GHSA-3xpg-4rpp-hhhm; range `>=7.15.0 <7.29.1`.
  - Advisory 1240046: undici vulnerable to cross-user cookie disclosure via Set-Cookie caching in shared caches — https://github.com/advisories/GHSA-2jfj-6hjv-fm6j; range `>=7.0.0 <7.29.1`.
  - Advisory 1240048: undici vulnerable to response truncation via oversized chunked responses in the dump interceptor — https://github.com/advisories/GHSA-2gqq-gqf2-x968; range `>=7.1.0 <7.29.1`.
  - Advisory 1240050: undici vulnerable to TLS certificate validation bypass via dropped connect options in BalancedPool — https://github.com/advisories/GHSA-w293-vg96-wgc3; range `>=7.24.1 <7.29.1`.
  - Advisory 1240052: undici vulnerable to caching and replay of unsafe HTTP method responses — https://github.com/advisories/GHSA-8436-99hf-9mmv; range `>=7.0.0 <7.29.1`.
  - Advisory 1240055: undici vulnerable to Denial of Service via WebSocketStream unclean close — https://github.com/advisories/GHSA-rx4f-c7p8-82vq; range `>=7.0.0 <7.29.1`.
- **wrangler** — installed 4.131.1; direct; affected range `<=0.0.0-7ae5dd357 || >=4.16.0`. npm fixAvailable: `{"name": "wrangler", "version": "4.15.2", "isSemVerMajor": true}`.
  - Propagated from `miniflare`.

#### MODERATE findings

- **fast-uri** — installed 3.1.7; transitive; affected range `3.0.0 - 3.1.7`. npm fixAvailable: `true`.
  - Advisory 1240091: fast-uri vulnerable to inconsistent host case normalization via percent-encoded octets — https://github.com/advisories/GHSA-hrr3-gc8f-f4qj; range `>=3.0.0 <3.1.8`.
- **smol-toml** — installed 1.8.0; transitive; affected range `<=1.8.0`. npm fixAvailable: `true`.
  - Advisory 1241205: smol-toml: Quadratic-time parse() from parseKey rescanning to end of document on each key line — https://github.com/advisories/GHSA-r4xh-jqrq-34v2; range `<=1.8.0`.

#### LOW findings

None.

#### INFO findings

None.

**Full audit stdout**

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "@astrojs/cloudflare": {
      "name": "@astrojs/cloudflare",
      "severity": "high",
      "isDirect": true,
      "via": [
        "@cloudflare/vite-plugin",
        "wrangler"
      ],
      "effects": [],
      "range": ">=12.6.8",
      "nodes": [
        "node_modules/@astrojs/cloudflare"
      ],
      "fixAvailable": {
        "name": "@astrojs/cloudflare",
        "version": "12.6.13",
        "isSemVerMajor": true
      }
    },
    "@cloudflare/vite-plugin": {
      "name": "@cloudflare/vite-plugin",
      "severity": "high",
      "isDirect": false,
      "via": [
        "miniflare",
        "wrangler"
      ],
      "effects": [
        "@astrojs/cloudflare"
      ],
      "range": "<=0.0.0-7ae5dd357 || >=1.2.3",
      "nodes": [
        "node_modules/@cloudflare/vite-plugin"
      ],
      "fixAvailable": {
        "name": "@astrojs/cloudflare",
        "version": "12.6.13",
        "isSemVerMajor": true
      }
    },
    "brace-expansion": {
      "name": "brace-expansion",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1240100,
          "name": "brace-expansion",
          "dependency": "brace-expansion",
          "title": "brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service",
          "url": "https://github.com/advisories/GHSA-q2hr-2g5m-vwhr",
          "severity": "moderate",
          "cwe": [
            "CWE-400",
            "CWE-407"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": "<1.1.21"
        },
        {
          "source": 1240103,
          "name": "brace-expansion",
          "dependency": "brace-expansion",
          "title": "brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service",
          "url": "https://github.com/advisories/GHSA-q2hr-2g5m-vwhr",
          "severity": "moderate",
          "cwe": [
            "CWE-400",
            "CWE-407"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": ">=4.0.0 <5.0.12"
        },
        {
          "source": 1240104,
          "name": "brace-expansion",
          "dependency": "brace-expansion",
          "title": "brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion",
          "url": "https://github.com/advisories/GHSA-qhr7-859c-m2p7",
          "severity": "high",
          "cwe": [
            "CWE-400",
            "CWE-674"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": "<1.1.20"
        },
        {
          "source": 1240107,
          "name": "brace-expansion",
          "dependency": "brace-expansion",
          "title": "brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion",
          "url": "https://github.com/advisories/GHSA-qhr7-859c-m2p7",
          "severity": "high",
          "cwe": [
            "CWE-400",
            "CWE-674"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=4.0.0 <5.0.11"
        },
        {
          "source": 1240108,
          "name": "brace-expansion",
          "dependency": "brace-expansion",
          "title": "brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion",
          "url": "https://github.com/advisories/GHSA-6j4f-fj2g-mc7p",
          "severity": "high",
          "cwe": [
            "CWE-400",
            "CWE-674"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": "<1.1.19"
        },
        {
          "source": 1240111,
          "name": "brace-expansion",
          "dependency": "brace-expansion",
          "title": "brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion",
          "url": "https://github.com/advisories/GHSA-6j4f-fj2g-mc7p",
          "severity": "high",
          "cwe": [
            "CWE-400",
            "CWE-674"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=4.0.0 <5.0.10"
        }
      ],
      "effects": [],
      "range": "<=1.1.20 || 4.0.0 - 5.0.11",
      "nodes": [
        "node_modules/brace-expansion",
        "node_modules/eslint-plugin-jsx-a11y/node_modules/brace-expansion",
        "node_modules/eslint-plugin-react/node_modules/brace-expansion"
      ],
      "fixAvailable": true
    },
    "devalue": {
      "name": "devalue",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1240870,
          "name": "devalue",
          "dependency": "devalue",
          "title": "devalue: `stringify`/`uneval` serialize shared memory",
          "url": "https://github.com/advisories/GHSA-j22f-vq7h-c4qm",
          "severity": "high",
          "cwe": [
            "CWE-200",
            "CWE-226"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N"
          },
          "range": ">=5.1.0 <=5.9.2"
        },
        {
          "source": 1240871,
          "name": "devalue",
          "dependency": "devalue",
          "title": "devalue: Residual sparse-array CPU amplification in uneval",
          "url": "https://github.com/advisories/GHSA-hx4r-w6wj-j8fg",
          "severity": "moderate",
          "cwe": [
            "CWE-400",
            "CWE-407"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": "<=5.9.2"
        },
        {
          "source": 1240872,
          "name": "devalue",
          "dependency": "devalue",
          "title": "devalue: Repeated primitive strings cause quadratic expansion in uneval",
          "url": "https://github.com/advisories/GHSA-mcm9-63f2-9j32",
          "severity": "high",
          "cwe": [
            "CWE-400",
            "CWE-409"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": "<=5.9.2"
        },
        {
          "source": 1240873,
          "name": "devalue",
          "dependency": "devalue",
          "title": "devalue: Sparse arrays emitted by uneval cause eager allocation when evaluated",
          "url": "https://github.com/advisories/GHSA-wf3x-273g-mvxv",
          "severity": "low",
          "cwe": [
            "CWE-400",
            "CWE-789"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": ">=1.0.0 <=5.9.2"
        },
        {
          "source": 1240874,
          "name": "devalue",
          "dependency": "devalue",
          "title": "devalue: stringifyAsync can cause an unhandled rejection despite a caught returned promise",
          "url": "https://github.com/advisories/GHSA-x5rw-q4pp-hg5g",
          "severity": "high",
          "cwe": [
            "CWE-248",
            "CWE-755"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": ">=5.8.0 <=5.9.2"
        },
        {
          "source": 1240875,
          "name": "devalue",
          "dependency": "devalue",
          "title": "devalue: Malformed null-prototype object keys bypass __proto__ rejection via property-key coercion",
          "url": "https://github.com/advisories/GHSA-4q55-j62x-fr9h",
          "severity": "moderate",
          "cwe": [
            "CWE-1321"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": "<=5.9.2"
        }
      ],
      "effects": [],
      "range": "<=5.9.2",
      "nodes": [
        "node_modules/devalue"
      ],
      "fixAvailable": true
    },
    "fast-uri": {
      "name": "fast-uri",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1240091,
          "name": "fast-uri",
          "dependency": "fast-uri",
          "title": "fast-uri vulnerable to inconsistent host case normalization via percent-encoded octets",
          "url": "https://github.com/advisories/GHSA-hrr3-gc8f-f4qj",
          "severity": "moderate",
          "cwe": [
            "CWE-178"
          ],
          "cvss": {
            "score": 4.8,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N"
          },
          "range": ">=3.0.0 <3.1.8"
        }
      ],
      "effects": [],
      "range": "3.0.0 - 3.1.7",
      "nodes": [
        "node_modules/fast-uri"
      ],
      "fixAvailable": true
    },
    "http-cache-semantics": {
      "name": "http-cache-semantics",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1240991,
          "name": "http-cache-semantics",
          "dependency": "http-cache-semantics",
          "title": "http-cache-semantics max-stale handling can disclose cross-user cached responses",
          "url": "https://github.com/advisories/GHSA-ch52-4w7c-c8xp",
          "severity": "high",
          "cwe": [
            "CWE-524"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N"
          },
          "range": "<=4.2.0"
        }
      ],
      "effects": [],
      "range": "<=4.2.0",
      "nodes": [
        "node_modules/http-cache-semantics"
      ],
      "fixAvailable": true
    },
    "miniflare": {
      "name": "miniflare",
      "severity": "high",
      "isDirect": false,
      "via": [
        "sharp",
        "undici"
      ],
      "effects": [
        "@cloudflare/vite-plugin",
        "wrangler"
      ],
      "range": "<=0.0.0-fec45ed61 || >=4.20250508.3",
      "nodes": [
        "node_modules/miniflare"
      ],
      "fixAvailable": {
        "name": "wrangler",
        "version": "4.15.2",
        "isSemVerMajor": true
      }
    },
    "sharp": {
      "name": "sharp",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1241331,
          "name": "sharp",
          "dependency": "sharp",
          "title": "sharp : Vulnerability in librsvg dependency CVE-2026-96889",
          "url": "https://github.com/advisories/GHSA-wq5f-xc86-pv6w",
          "severity": "high",
          "cwe": [
            "CWE-416",
            "CWE-1395"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": "<0.35.5"
        }
      ],
      "effects": [
        "miniflare"
      ],
      "range": "<0.35.5",
      "nodes": [
        "node_modules/sharp"
      ],
      "fixAvailable": {
        "name": "wrangler",
        "version": "4.15.2",
        "isSemVerMajor": true
      }
    },
    "smol-toml": {
      "name": "smol-toml",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1241205,
          "name": "smol-toml",
          "dependency": "smol-toml",
          "title": "smol-toml: Quadratic-time parse() from parseKey rescanning to end of document on each key line",
          "url": "https://github.com/advisories/GHSA-r4xh-jqrq-34v2",
          "severity": "moderate",
          "cwe": [
            "CWE-407"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": "<=1.8.0"
        }
      ],
      "effects": [],
      "range": "<=1.8.0",
      "nodes": [
        "node_modules/smol-toml"
      ],
      "fixAvailable": true
    },
    "source-map-js": {
      "name": "source-map-js",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1241209,
          "name": "source-map-js",
          "dependency": "source-map-js",
          "title": "source-map-js allows event-loop denial of service through indexed source-map section offsets",
          "url": "https://github.com/advisories/GHSA-68fv-2mgg-jv7q",
          "severity": "high",
          "cwe": [
            "CWE-1284"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=1.0.0 <1.2.2"
        }
      ],
      "effects": [],
      "range": "1.0.0 - 1.2.1",
      "nodes": [
        "node_modules/source-map-js"
      ],
      "fixAvailable": true
    },
    "undici": {
      "name": "undici",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1239933,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to Denial of Service via unhandled error in WebSocket permessage-deflate decompression",
          "url": "https://github.com/advisories/GHSA-3wwx-pv8p-q78v",
          "severity": "moderate",
          "cwe": [
            "CWE-248"
          ],
          "cvss": {
            "score": 5.9,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=7.28.0 <7.29.1"
        },
        {
          "source": 1240036,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to Denial of Service via orphaned RetryHandler response body",
          "url": "https://github.com/advisories/GHSA-pmjh-fq2x-6v4x",
          "severity": "moderate",
          "cwe": [
            "CWE-772"
          ],
          "cvss": {
            "score": 5.9,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=7.11.0 <7.29.1"
        },
        {
          "source": 1240038,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to downstream response splitting via retry interceptor",
          "url": "https://github.com/advisories/GHSA-r53p-7pc4-xj5r",
          "severity": "low",
          "cwe": [
            "CWE-444"
          ],
          "cvss": {
            "score": 3.7,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N"
          },
          "range": ">=7.0.0 <7.29.1"
        },
        {
          "source": 1240041,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to Denial of Service via unrequested WebSocket subprotocol",
          "url": "https://github.com/advisories/GHSA-rfgv-xxqx-mfg5",
          "severity": "high",
          "cwe": [
            "CWE-248",
            "CWE-252"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=7.0.0 <7.29.1"
        },
        {
          "source": 1240044,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to Denial of Service via unbounded decompression of compressed responses",
          "url": "https://github.com/advisories/GHSA-3xpg-4rpp-hhhm",
          "severity": "moderate",
          "cwe": [
            "CWE-770"
          ],
          "cvss": {
            "score": 5.9,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=7.15.0 <7.29.1"
        },
        {
          "source": 1240046,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to cross-user cookie disclosure via Set-Cookie caching in shared caches",
          "url": "https://github.com/advisories/GHSA-2jfj-6hjv-fm6j",
          "severity": "moderate",
          "cwe": [
            "CWE-200",
            "CWE-524"
          ],
          "cvss": {
            "score": 6.5,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:L/A:N"
          },
          "range": ">=7.0.0 <7.29.1"
        },
        {
          "source": 1240048,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to response truncation via oversized chunked responses in the dump interceptor",
          "url": "https://github.com/advisories/GHSA-2gqq-gqf2-x968",
          "severity": "low",
          "cwe": [
            "CWE-20",
            "CWE-248"
          ],
          "cvss": {
            "score": 3.7,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N"
          },
          "range": ">=7.1.0 <7.29.1"
        },
        {
          "source": 1240050,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to TLS certificate validation bypass via dropped connect options in BalancedPool",
          "url": "https://github.com/advisories/GHSA-w293-vg96-wgc3",
          "severity": "high",
          "cwe": [
            "CWE-295"
          ],
          "cvss": {
            "score": 7.4,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N"
          },
          "range": ">=7.24.1 <7.29.1"
        },
        {
          "source": 1240052,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to caching and replay of unsafe HTTP method responses",
          "url": "https://github.com/advisories/GHSA-8436-99hf-9mmv",
          "severity": "low",
          "cwe": [
            "CWE-345"
          ],
          "cvss": {
            "score": 3.7,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N"
          },
          "range": ">=7.0.0 <7.29.1"
        },
        {
          "source": 1240055,
          "name": "undici",
          "dependency": "undici",
          "title": "undici vulnerable to Denial of Service via WebSocketStream unclean close",
          "url": "https://github.com/advisories/GHSA-rx4f-c7p8-82vq",
          "severity": "moderate",
          "cwe": [
            "CWE-248",
            "CWE-754"
          ],
          "cvss": {
            "score": 5.9,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": ">=7.0.0 <7.29.1"
        }
      ],
      "effects": [
        "miniflare"
      ],
      "range": "7.0.0 - 7.29.0",
      "nodes": [
        "node_modules/undici"
      ],
      "fixAvailable": {
        "name": "wrangler",
        "version": "4.15.2",
        "isSemVerMajor": true
      }
    },
    "wrangler": {
      "name": "wrangler",
      "severity": "high",
      "isDirect": true,
      "via": [
        "miniflare"
      ],
      "effects": [
        "@astrojs/cloudflare",
        "@cloudflare/vite-plugin"
      ],
      "range": "<=0.0.0-7ae5dd357 || >=4.16.0",
      "nodes": [
        "node_modules/wrangler"
      ],
      "fixAvailable": {
        "name": "wrangler",
        "version": "4.15.2",
        "isSemVerMajor": true
      }
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 2,
      "high": 10,
      "critical": 0,
      "total": 12
    },
    "dependencies": {
      "prod": 377,
      "dev": 269,
      "optional": 167,
      "peer": 0,
      "peerOptional": 0,
      "total": 804
    }
  }
}
```

**Audit stderr**

```text

```

## Hints recorded but not acted on

| Hint | Value |
| --- | --- |
| team_size | solo |
| deployment_target | cloudflare-workers |
| ci_provider | github-actions |
| ci_default_flow | auto-deploy-on-merge |
| bootstrapper_confidence | first-class |
| path_taken | standard |
| quality_override | false |
| self_check_answers | null |
| has_auth | true |
| has_payments | false |
| has_realtime | false |
| has_ai | true |
| has_background_jobs | false |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). The scaffold and verification are complete; engine compatibility warnings and dependency audit findings remain for review.

Useful manual steps:
- Review AGENTS.md.scaffold against the existing AGENTS.md.
- Use a Node version supported by the installed lint packages and review the starter's older .nvmrc pin.
- Review high-severity audit findings before deployment; some npm recommendations change major versions and should be assessed individually.
- Configure Supabase using README.md: copy .env.example to .env and .dev.vars, then supply SUPABASE_URL and SUPABASE_KEY before testing authentication.
- Run npm run dev to start local development; auth smoke testing requires a reachable Supabase service.
- Set the real site URL when a deployment domain is known to enable sitemap generation.
- Git is already initialized. The inherited CI workflow is validation only; deployment automation from the hand-off has not been configured.
