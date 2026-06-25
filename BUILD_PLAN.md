# BUILD_PLAN.md — FIMCO Broker Back Office

A Claude Code–oriented build plan. Read `CLAUDE.md` first for domain rules and the
non-negotiable money-movement invariants. This plan separates **what can start now**
(un-blocked) from **what waits on discovery answers** (see `DISCOVERY_CHECKLIST.md`).

## Guiding approach

- Modular monolith, single Postgres, one deployable service.
- Every external party sits behind a stubbable adapter, so the core builds and tests
  without live DSE/CSD/nTZS-prod access.
- Build the un-blocked foundation now; pin the money-critical core once discovery lands.
- Small PRs. Money paths require integration tests against the nTZS **test** environment.

## Repository layout

```
fimco-bbo/
├── CLAUDE.md                  # domain rules + guardrails (read first)
├── BUILD_PLAN.md              # this file
├── DISCOVERY_CHECKLIST.md     # external questions blocking the core
├── docker-compose.yml         # local Postgres, Redis, app
├── .github/workflows/ci.yml   # lint, typecheck, test, build
├── packages/ (or src/)
│   ├── core/
│   │   ├── ledger/            # event-sourced securities ledger, event store
│   │   ├── accounts/          # client accounts, holdings sub-ledger
│   │   ├── cash/              # CashLedger interface + nTZS-backed impl
│   │   ├── trades/            # trade capture, lifecycle state machine
│   │   ├── fees/              # configurable tariff/tax engine
│   │   ├── contractnotes/     # generation + immutable store + dispatch
│   │   ├── reconciliation/    # 3-way match, break queue
│   │   ├── settlement/        # orchestrator: stock leg + cash leg vs cycle
│   │   ├── corpactions/       # dividends, rights, bonus, splits
│   │   ├── reporting/         # CMSA/DSE report generation
│   │   ├── controls/          # RBAC, maker-checker, audit log
│   │   └── shared/            # money types (integer minor units), errors, ids
│   ├── adapters/
│   │   ├── ntzs/              # nTZS client + webhook verifier (+ stub)
│   │   ├── dse/               # DSE trades feed (+ stub)
│   │   ├── csd/               # CSD positions/settlement (+ stub)
│   │   ├── kyc/               # NIDA + bank reliance (+ stub)
│   │   └── notify/            # email/SMS dispatch (+ stub)
│   ├── api/                   # HTTP layer, auth, RBAC enforcement, webhooks
│   └── web/                   # React operator console + client portal
└── test/                      # integration + e2e, incl. nTZS test-env tests
```

## Phase 0 — Foundation (start now, ~1–2 weeks)

- [ ] Scaffold repo, TypeScript config, lint, CI (lint/typecheck/test/build).
- [ ] `docker-compose` with Postgres + Redis; migration tooling.
- [ ] `shared`: money type as integer minor units, typed IDs, idempotency-key helper, error model.
- [ ] Event store primitives (append-only; no UPDATE/DELETE) + projection pattern.
- [ ] Auth scaffold (OIDC/SSO-ready), RBAC with default-deny, audit-log writer.
- [ ] **Maker-checker primitive** in the domain layer (initiate -> pending -> approve, initiator != approver).

**Exit:** CI green; a trivial money-moving action is forced through maker-checker + idempotency + audit by tests.

## Phase 1 — Cash & ledger core (un-blocked, ~3–5 weeks)

Buildable now against the nTZS **test** environment and stubs.

- [ ] `cash`: define `CashLedger` interface; implement nTZS-backed adapter
      (provision subwallet via `POST /users`, store nTZS `id`, balance reads, transfers, deposits).
- [ ] nTZS **webhook receiver**: verify HMAC-SHA256 signature, idempotent handling, redelivery-safe.
- [ ] Treasury **sub-wallet topology**: Escrow / Settlement / Reserves / Disbursement / Fees;
      typed helpers for inter-wallet moves. (Do NOT wire T+0 seller payouts yet — blocked.)
- [ ] `accounts`: client account model, holdings sub-ledger, account-to-cash linkage.
- [ ] `ledger`: securities event log (orders, executions, positions) + projections.
- [ ] Daily **cash reconciliation** job: prove our cash ledger == nTZS balances; alert on drift.
- [ ] KYC onboarding flow against the `kyc` **stub** (NIDA + bank reliance shape).

**Exit:** onboard a test client, fund via nTZS test deposit, hold a cash balance, full audit trail,
reconciliation job passes.

## Phase 2 — Trade lifecycle (partially blocked)

Un-blocked sub-parts can start; reconciliation/settlement specifics wait on DSE API specs.

- [ ] `trades`: capture + lifecycle state machine (captured -> priced -> reconciled -> settling -> settled/failed).
- [ ] `fees`: configurable, **versioned** tariff tables (brokerage tiers, DSE/CMSA levies, VAT, CGT/stamp where applicable). Itemised, auditable. (Rates confirmed in discovery; structure builds now.)
- [ ] `contractnotes`: render itemised note, immutable store, dispatch via `notify` (email/SMS/portal).
- [ ] `reconciliation`: 3-way match engine + break/exception queue with maker-checker resolution — **build against DSE/CSD stubs; finalize formats once specs land.**
- [ ] `settlement`: orchestrator tracking both legs vs the configurable cycle; cash leg via nTZS;
      **T+0 advance path gated on CMSA ruling.**

**Exit (go-live candidate):** end-to-end trade -> contract note -> reconciled settlement across both
legs, using stubbed DSE/CSD until real specs are wired.

## Phase 3 — Reporting & corporate actions (blocked on formats)

- [ ] `reporting`: CMSA/DSE reports in mandated formats (formats from discovery), transaction +
      client-activity logs, export/submission.
- [ ] `corpactions`: entitlement calc on record-date holdings; cash distributions via nTZS;
      stock entitlements posted to the securities ledger.

**Exit:** a full reporting period generates and validates; a dividend run executes end-to-end.

## Phase 4 — Hardening & go-live

- [ ] Client portal/statements; operator console polish.
- [ ] Independent **penetration test**, performance test, DR drill (tested restore, RTO/RPO).
- [ ] Data migration; UAT with CMSA-aligned scenarios; production cutover (target/residency from discovery).

**Exit:** security sign-off, UAT acceptance, production go-live.

## How to drive this with Claude Code

1. Point Claude Code at this repo; it reads `CLAUDE.md` automatically for context.
2. Work phase by phase; keep PRs small and reviewable. A senior engineer reviews every money-path PR.
3. For each module, ask for: domain types + interface first, then the stub adapter, then the
   real adapter, then tests — in that order, so the core is testable before live access exists.
4. Keep stubs and real adapters in lockstep; integration tests for money paths run against the
   nTZS test environment, never production.
5. Do not let the agent implement anything under "BLOCKED" in `CLAUDE.md` until the matching
   discovery answer is recorded.

## Parallel track: discovery

Phases 0–1 (and parts of 2) proceed while the four discovery questions are chased. See
`DISCOVERY_CHECKLIST.md`. The reconciliation/settlement core, reporting, and the T+0 advance
path should not be finalized until their answers are in.
