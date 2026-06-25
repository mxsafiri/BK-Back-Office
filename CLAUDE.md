# CLAUDE.md — FIMCO Broker Back Office

Context for Claude Code working in this repository. Read this fully before writing code.

## What this is

A **sell-side broker back office** for the Dar es Salaam Stock Exchange (DSE) ecosystem.
It reconciles trades, issues contract notes, prices fees/taxes, processes settlement,
keeps client cash + securities ledgers, handles corporate actions, and files regulatory
reports with CMSA and DSE.

This is a **regulated financial system that moves client money**. Correctness, auditability,
and segregation of duties are not optional. When in doubt, choose the safer, more auditable
option and surface the decision rather than guessing.

## The core mental model: two ledgers

1. **Securities ledger (we build it).** The authoritative, append-only, event-sourced record
   of every order, execution, position, and corporate-action entitlement. The audit trail is a
   by-product of the event log, not a separate feature.
2. **Cash ledger (delegated to nTZS).** Client money lives in per-client nTZS subwallets; firm
   funds live in purpose-segregated treasury sub-wallets. **We never move shillings directly** —
   we instruct the nTZS API and record the returned on-chain tx reference against the trade.

A trade is **settled only when BOTH legs reconcile**: CSD confirms the stock leg AND an nTZS
webhook confirms the cash leg. This is delivery-versus-payment (DvP) across two systems.

## The money layer: nTZS

nTZS is a Tanzania-backed stablecoin with Wallet-as-a-Service. Docs: https://www.ntzs.co.tz/developers

- **Per-client subwallet** = a client's cash account. Provisioned via `POST /users` (our `externalId` -> their `id` + wallet). **Always store and use their `id` as `userId`**, never our externalId, for deposits/transfers/withdrawals.
- **Treasury sub-wallets** (HD-derived, partner-controlled) segregate firm funds by purpose:
  `Escrow` (buyer cash locked on order), `Settlement` (netting float), `Reserves`
  (backs T+0 advances), `Disbursement` (client payouts), `Fees` (brokerage + levies).
- **Deposit/on-ramp:** `POST /deposits` mints nTZS 1:1 from mobile money/card. `collectToTreasury:true` mints to treasury (escrow flows).
- **Transfer:** `POST /transfers` — synchronous, on-chain. Platform fee skimmed atomically to treasury. Use `toUserId` OR `toAddress`, never both.
- **Withdrawal/off-ramp:** `POST /withdrawals` burns nTZS, pays mobile money. **>= 1,000,000 TZS requires nTZS admin approval** — handle the async `requested` status, do not assume instant completion.
- **Balance:** `GET /users/:id` reads live on-chain balance (no caching). Check before every transfer/withdrawal.

### T+0 model and its boundary
nTZS gives **T+0 on the cash leg only**. The securities leg still settles at the DSE CSD on
its T+2/T+3 cycle. Paying a seller at T+0 before CSD settlement is a **settlement advance** —
a reserve-backed credit position. **Do not implement T+0 seller payouts until the CMSA
client-money ruling (see BLOCKED below) confirms it is permitted and how the float must be backed.**

## NON-NEGOTIABLE money-movement rules

These are invariants. Code that violates them must not be merged.

1. **Idempotency on every financial operation.** Every deposit/transfer/withdrawal/settlement
   action carries a client-generated idempotency key. Re-processing the same key is a no-op that
   returns the original result. Webhooks WILL be redelivered — handle duplicates safely.
2. **Verify every nTZS webhook signature** (HMAC-SHA256 over `timestamp.body`) before acting on it.
   Reject on mismatch. Never trust an unsigned/forged event.
3. **Maker-checker on every money- or position-moving action.** Initiator != approver. No single
   user can move funds or alter positions alone. Enforce in the domain layer, not just the UI.
4. **Money is integer minor units, never floats.** nTZS amounts are integer TZS. Never use
   JavaScript floating-point for money math. USDC has 6 decimals — handle as integers too.
5. **Append-only ledgers.** Never UPDATE or DELETE a ledger/event row. Corrections are new
   reversing entries that reference the original.
6. **The nTZS tx reference is the source of truth for cash.** Our cash ledger mirrors nTZS;
   a daily reconciliation job must prove they match and alert on any drift.
7. **Secrets never in code or client.** The `ntzs_live_` key and all secrets come from the
   secrets manager / env, used **only from the backend**. Never log full keys, wallet seeds,
   webhook secrets, or PII. Test keys are `ntzs_test_`.
8. **Least privilege RBAC + segregation of duties** on every endpoint. Default deny.

## Architecture decisions (do not relitigate without flagging)

- **Modular monolith**, not microservices, for v1. One deployable service, clean internal module
  boundaries, one transactional Postgres DB. Easier to keep the ledger consistent and to audit.
- **Postgres** as system of record; event-sourced trade log.
- **One integration adapter per external party** (nTZS, DSE, CSD, NIDA/bank KYC, bank statements).
  Each adapter is **independently stubbable** so the core builds and tests without live access.
- **Cash store behind an interface.** The custody design (nTZS-only vs nTZS + bank trust account)
  is not yet final (CMSA ruling pending). Program the cash ledger against a `CashLedger` interface
  so the backing store can change without rewriting the back office.
- **Settlement cycle is a config value**, not a constant. Brief says T+2; public DSE rules say T+3.
  Default to config; confirm before go-live.
- Backend: TypeScript/Node (nTZS SDK is JS-native; strong typing for money logic). Frontend: React.

## Definition of done (every PR)

- Tests written and passing (unit + integration; money paths need integration tests against nTZS test env).
- Money-movement rules above upheld; idempotency + maker-checker covered by tests.
- No secrets/PII in code or logs.
- Audit events emitted for any state change to money or positions.
- Adapter changes keep the stub in sync with the real implementation.

## BLOCKED — do not build until answered (see DISCOVERY_CHECKLIST.md)

These depend on external answers. Building them now means guessing and reworking.

- **Final cash-leg / custody design** — pending CMSA ruling on client funds as nTZS and on T+0
  settlement advances. Until then: build against the `CashLedger` interface, do NOT hardcode
  T+0 seller payouts.
- **DSE/CSD reconciliation + settlement instruction format** — pending DSE API specs.
- **Exact settlement cycle (T+2/T+3)** — config-driven; confirm value.
- **Regulatory report formats** — pending CMSA/DSE specs.
- **Hosting/data residency** — pending CMSA expectation; affects deploy target.

## What IS safe to build now

Repo scaffold, securities ledger + event store, RBAC/maker-checker/audit, nTZS integration
against the **test environment**, sub-wallet topology, fee/tax engine structure (configurable
tariffs), contract-note generation, operator console shell, client portal shell, CI. See BUILD_PLAN.md.

## Conventions

- Conventional commits. Small, reviewable PRs.
- No new dependency without justification (regulated system — minimize supply-chain surface).
- Every money amount in code comments and DB columns states its unit (e.g. `amount_tzs_minor`).
- Prefer explicit, boring code over clever abstractions in the money paths.
