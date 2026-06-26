# FIMCO Broker Back Office (`fimco-bbo`)

Sell-side broker back office for the Dar es Salaam Stock Exchange (DSE) ecosystem.
This is a **regulated system that moves client money** — read [`CLAUDE.md`](./CLAUDE.md)
before writing code.

## Status

**Phase 1 — cash & ledger core (in progress).** Phase 0 foundation (money types, idempotency,
append-only event store, maker-checker, audit log, nTZS webhook verification, `CashLedger`
interface) is complete. Phase 1 adds, against the nTZS **test** environment and stubs:

- Treasury sub-wallet topology (Escrow / Settlement / Reserves / Disbursement / Fees), with the
  T+0 advance path **refused in code** pending the CMSA ruling.
- nTZS-backed `CashLedger` adapter (provision / balance / deposit / transfer / withdraw) plus the
  in-memory stub kept in lockstep.
- nTZS webhook **receiver**: signature-verified, idempotent, redelivery-safe; mirrors confirmed
  cash movements.
- `accounts`: client account model, holdings (securities) sub-ledger, account-to-cash linkage,
  and a KYC-gated onboarding flow (NIDA + bank-reliance stub).
- Securities event log (orders / executions) with a positions projection.
- Daily **cash reconciliation** job: mirror vs live nTZS balances, alerts on drift.

Settlement, the 3-way reconciliation against DSE/CSD, regulatory reports, and the T+0 advance
path remain **blocked** pending the answers in [`DISCOVERY_CHECKLIST.md`](./DISCOVERY_CHECKLIST.md).

## Quick start

```bash
npm install
npm run typecheck
npm run test
npm run build
docker compose up -d   # optional: local Postgres + Redis
cp .env.example .env    # fill in nTZS TEST keys (ntzs_test_...)
```

## Layout

A monorepo (npm workspaces). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the frontend /
backend / production boundaries and [`BUILD_PLAN.md`](./BUILD_PLAN.md) for the phased plan.
Dependencies point strictly inward: `adapters → core → shared`.

```
packages/
  shared/      money (integer minor units), ids, idempotency, errors   (no deps)
  core/        the domain — ports, logic, in-memory reference impls     (deps: shared)
    ledger/          append-only event store + securities ledger (orders/executions)
    controls/        maker-checker, audit log
    cash/            CashLedger port, treasury topology, cash mirror, in-memory ledger
    accounts/        client accounts, holdings sub-ledger, onboarding
    reconciliation/  daily cash reconciliation job
    kyc/             KYC port + in-memory stub (NIDA + bank reliance)
  adapters/    real outside-world integrations                          (deps: core, shared)
    ntzs/      nTZS HTTP CashLedger, webhook verifier + receiver
  ui/          shared design system (Tailwind preset + components)          (deps: react)
  api-client/  typed frontend↔backend contract (DTOs + fetch client)        (no deps)
apps/
  api/           Fastify HTTP service + jobs (the one deployable backend)
    health · nTZS webhook (HMAC) · onboarding · account balance · default-deny RBAC
  web-site/      Next.js landing / pitch page (public)
  web-operator/  Next.js operator console (FIMCO navy/red brand)
  web-portal/    Next.js client portal
```

`web-operator` and `web-portal` are the demo apps (password-gated, sample data); `web-site` is the
public landing page. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the Vercel setup and
[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for the brand.

Run `npm install` once at the root; workspaces are linked automatically. `npm run test` /
`typecheck` / `lint` / `build` operate across the whole repo. Run the backend locally with
`npm run dev -w @fimco/api` (defaults to port 3001; `GET /health` to check).

## The one pattern to copy

Every money path goes through **maker-checker → idempotency → audit**. See
`packages/core/src/controls/moneyMove.integration.test.ts` for the template.

## Contributing & docs

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, branch/PR flow, the money-path review gate, DoD.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — frontend / backend / production boundaries.
- [`docs/adr/`](./docs/adr) — architecture decision records (stack, structure).
- [`CLAUDE.md`](./CLAUDE.md) — domain rules + non-negotiable money-movement invariants.

## Non-negotiables

Idempotency, webhook signature verification, maker-checker, integer-only money math,
append-only ledgers, secrets from env only. Full list in `CLAUDE.md`.

## Working with Claude Code

Point Claude Code at this repo and say: *"Read CLAUDE.md and BUILD_PLAN.md, then continue
Phase 0/1."* Do not implement anything under **BLOCKED** in `CLAUDE.md` until the matching
discovery answer is recorded.
