# DEPLOYMENT.md — FIMCO demo on Vercel

The MVP demo is **three Next.js apps deployed to Vercel** from this monorepo. It is a **static
demo** (sample data + in-memory simulation) — no backend server is hosted. The real Fastify API
+ Postgres are the paid-phase work.

| App | Path | What it is | Public? |
|---|---|---|---|
| Landing | `apps/web-site` | Marketing / pitch page | Public |
| Operator Console | `apps/web-operator` | Internal back-office demo | Password-gated |
| Client Portal | `apps/web-portal` | Client-facing demo | Password-gated |

Why Vercel: it's the Next.js platform — zero-config App Router + route handlers, npm-workspaces
monorepo support, preview URLs per push, custom domains, free tier.

## One-time: connect the repo
1. Sign in to [vercel.com](https://vercel.com) and **Add New → Project → Import** `mxsafiri/BK-Back-Office`.
2. Create **three separate Vercel projects** from the same repo (one per app), each with a different
   **Root Directory**. Vercel auto-detects Next.js and npm workspaces (it installs from the repo root).

### Project settings (repeat per app)
| Setting | Value |
|---|---|
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `apps/web-site` · `apps/web-operator` · `apps/web-portal` |
| Build / Install / Output | leave default (`next build` / `npm install` / `.next`) |

### Environment variables
- **web-operator** and **web-portal**: set `DEMO_PASSWORD` to the shared password you'll give FIMCO.
  (If unset, the gate is OFF and the app is public — so always set it for the shared demo.)
- **web-site**: set `NEXT_PUBLIC_OPERATOR_URL` and `NEXT_PUBLIC_PORTAL_URL` to the deployed operator
  and portal URLs (so the landing CTAs point at the live demos).

### Recommended order
1. Deploy **web-operator** and **web-portal** first → note their URLs (e.g. `fimco-operator.vercel.app`).
2. Set those URLs as `NEXT_PUBLIC_OPERATOR_URL` / `NEXT_PUBLIC_PORTAL_URL` on **web-site**, then deploy it.
3. (Optional) Add custom domains, e.g. `app.fimco…`, `portal.fimco…`, `fimco…`.

## CLI alternative
```bash
npm i -g vercel
# from each app directory:
cd apps/web-operator && vercel link && vercel --prod   # repeat for web-portal, web-site
```
Set env vars with `vercel env add DEMO_PASSWORD` (operator/portal) and the `NEXT_PUBLIC_*` URLs (site).

## Sharing with FIMCO
Send: the **landing URL** (public) + the **shared password**. They click "Operator Console demo" /
"Client Portal demo" from the landing, enter the password once per app, and explore.

## Notes & limits (by design for the MVP)
- **Static demo:** screens use realistic sample data; onboarding/balance are simulated via the real
  `@fimco/api-client` contract. No client money moves.
- **No persistence:** the demo doesn't store data between sessions. The real domain logic already
  exists in `@fimco/core` behind the Fastify API — wiring that + Postgres + the live nTZS/DSE
  integrations is the production engagement.
- **Build:** the frontends consume `@fimco/ui` and `@fimco/api-client` as source (Next
  `transpilePackages`), so no pre-build step is needed on Vercel.
