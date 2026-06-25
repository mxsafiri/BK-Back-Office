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

See [`BUILD_PLAN.md`](./BUILD_PLAN.md) for the full module map and phased task breakdown.

```
src/
  shared/      money (integer minor units), ids, idempotency, errors
  core/
    ledger/          append-only event store + securities ledger (orders/executions)
    controls/        maker-checker, audit log
    cash/            CashLedger interface, treasury topology, cash mirror
    accounts/        client accounts, holdings sub-ledger, onboarding
    reconciliation/  daily cash reconciliation job
  adapters/
    ntzs/      CashLedger adapter + stub, webhook verifier + receiver
    kyc/       KYC provider port + stub (NIDA + bank reliance)
```

## The one pattern to copy

Every money path goes through **maker-checker → idempotency → audit**. See
`src/core/controls/moneyMove.integration.test.ts` for the template.

## Non-negotiables

Idempotency, webhook signature verification, maker-checker, integer-only money math,
append-only ledgers, secrets from env only. Full list in `CLAUDE.md`.

## Working with Claude Code

Point Claude Code at this repo and say: *"Read CLAUDE.md and BUILD_PLAN.md, then continue
Phase 0/1."* Do not implement anything under **BLOCKED** in `CLAUDE.md` until the matching
discovery answer is recorded.
