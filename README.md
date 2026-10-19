# 10x Astro Starter

![](./public/template.png)

A modern, opinionated starter template for building fast, accessible web applications.

## Tech Stack

- [Astro](https://astro.build/) v7 - Modern web framework with server-first rendering
- [React](https://react.dev/) v19 - UI library for interactive components
- [TypeScript](https://www.typescriptlang.org/) v6 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Authentication and backend-as-a-service
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge deployment runtime

## Prerequisites

- Node.js v22.23.3 (as specified in `.nvmrc`; older Node 22 releases do not meet all locked dependency requirements)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase and configure environment variables — see [Supabase Configuration](#supabase-configuration) below.

4. Create a `.dev.vars` file for local Cloudflare dev secrets:

```bash
cp .env.example .dev.vars
```

5. Run the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server (Cloudflare workerd runtime)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with type-checked rules
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Run Prettier
- `npm run smoke` - Smoke test the auth flow against a running server (`BASE_URL`, defaults to `http://localhost:4321`)
- `npm run check:catalog` - Check integrity of the meal catalog and its acceptance cases (`src/data/meal-catalog*.v1.json`)
- `npm run test:catalog` - Run the catalog checker tests (native `node:test`)

The meal catalog data contract, versioning rules and review procedure are documented in [docs/catalog/README.md](docs/catalog/README.md).

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
├── wrangler.jsonc # Cloudflare Workers config
```

## Supabase Configuration

This project uses [Supabase](https://supabase.com/) for authentication. Environment variables are declared via Astro's `astro:env` schema and are treated as **server-only secrets** — they are never exposed to the client.

### First-time setup (local, no cloud project needed)

Requires [Docker](https://www.docker.com/) and ~7 GB RAM.

1. Create your `.env` file:

```bash
cp .env.example .env
```

2. Initialize the local Supabase project (creates a `supabase/` config folder):

```bash
npx supabase init
```

3. Start the local stack (downloads Docker images on first run):

```bash
npx supabase start
```

4. Copy the credentials printed by the CLI into your `.env` and `.dev.vars`:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<anon key from CLI output>
```

5. To stop the stack when done:

```bash
npx supabase stop
```

The local Studio UI is available at `http://localhost:54323`.

No database tables or migrations are required — this project uses Supabase Auth's built-in `auth.users` table only.

### Using a cloud Supabase project instead

If you prefer to use a hosted Supabase project, add these variables to your `.env` and `.dev.vars` files:

| Variable       | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `SUPABASE_URL` | Project URL from Supabase dashboard → Settings → API       |
| `SUPABASE_KEY` | `anon` public key from Supabase dashboard → Settings → API |

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon-key>
```

### Email confirmation for this technical demo

This first deployment uses sign-up without email confirmation. Disable confirmation in both the staging and production Supabase projects, as well as your local setup:

1. Open the Supabase dashboard for your project
2. Go to **Authentication → Email → Confirm email**
3. Toggle it **off**

Users can then sign in immediately after sign-up without clicking a confirmation link.

Email confirmation, SMTP and password recovery must be configured before the full MealAdapt MVP is shared. The current starter does not implement password recovery.

### Auth routes

| Route                 | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `/auth/signin`        | Email/password sign-in form                                             |
| `/auth/signup`        | Email/password sign-up form                                             |
| `/auth/confirm-email` | Post-signup success page for registration without email confirmation     |
| `/dashboard`          | Example protected page (redirects to `/auth/signin` if unauthenticated) |

Route protection is handled in `src/middleware.ts`. Add paths to the `PROTECTED_ROUTES` array there to require authentication.

## Deployment

This project deploys to [Cloudflare Workers](https://workers.cloudflare.com/).

The approved first-deployment procedure, manual setup gates and rollback commands are in [context/deployment/deploy-plan.md](context/deployment/deploy-plan.md). Create the two Workers and Supabase projects and supply scoped credentials before publishing.

Staging (uses `.dev.vars.staging` with staging Supabase credentials):

```bash
CLOUDFLARE_ENV=staging npm run build
npx --no-install wrangler deploy --config dist/server/wrangler.json --dry-run
npx --no-install wrangler deploy --config dist/server/wrangler.json --secrets-file .dev.vars.staging
```

Production, after staging tests pass (uses `.env.production` with production credentials):

```bash
env -u CLOUDFLARE_ENV npm run build
npx --no-install wrangler deploy --config dist/server/wrangler.json --dry-run
npx --no-install wrangler deployments list --name meal-adapt --json
npx --no-install wrangler deploy --config dist/server/wrangler.json --secrets-file .env.production
```

Run each command separately and stop on failure. Record the production baseline version before publishing. Generated configuration must target the intended Worker. Both local secrets files are ignored by Git; `SUPABASE_KEY` must be an anon/publishable key, not service_role. `wrangler secret put` immediately publishes a new version, so the approved procedure uploads secrets together with code. Set each Supabase Site URL to the corresponding deployed address.

Both Workers need a baseline returning HTTP 503 with the same environment-specific Supabase secrets as the application. Rehearse rollback on staging before production. The approved procedure in the deployment plan includes the rehearsal, source manifest verification and manual setup gates; the commands above are only the publication excerpt.

Record deployment sources with `node scripts/deploy-manifest.mjs write` before staging validation. Run `node scripts/deploy-manifest.mjs check` before each publication. Changes to covered files require rebuilding and validating staging before recording a new manifest.

## Smoke test

`scripts/smoke.mjs` is a dependency-free Node script that walks the whole auth flow (sign-up, sign-in, protected page, sign-out) over HTTP. Run it against the dev server or the production preview after dependency upgrades:

```bash
npm run dev            # or: npm run build && npm run preview
BASE_URL=http://localhost:4321 npm run smoke
```

It needs a reachable Supabase instance (local or cloud) with email confirmation disabled.

> **Note:** this script exists primarily to guard the development of the starter itself — it is a fast sanity check that dependency upgrades did not break the build, the Cloudflare adapter or the Supabase auth flow. It is **not** a substitute for a real test suite. Once you build your own product on top of this starter, add proper tests (unit, integration, end-to-end) suited to your application.

## CI

GitHub Actions runs two jobs on every push and PR to `main`:

- **ci** — meal catalog check and tests (`npm run check:catalog`, `npm run test:catalog`), lint, `astro check` and build. Configure `SUPABASE_URL` and `SUPABASE_KEY` as repository secrets for the build step.
- **smoke** — starts a local Supabase via the Supabase CLI, builds, serves the production preview on the Cloudflare runtime and runs `npm run smoke` against it. No secrets required.

## License

MIT
