# Contributing — FIMCO Broker Back Office

This is a **regulated financial system that moves client money**. Correctness, auditability, and
segregation of duties are not optional. Before writing code, read [`CLAUDE.md`](./CLAUDE.md)
(domain rules + non-negotiable money-movement invariants) and [`ARCHITECTURE.md`](./ARCHITECTURE.md)
(frontend / backend / production boundaries).

## Getting started

```bash
# Requires Node >= 20 and npm >= 9
npm install                 # links all workspaces
cp .env.example .env        # fill in nTZS TEST keys (ntzs_test_...) — never commit .env
docker compose up -d        # optional: local Postgres + Redis

npm run typecheck           # whole-repo typecheck
npm run test                # all tests
npm run lint
npm run build
```

The repo is an **npm-workspaces monorepo**. See [`ARCHITECTURE.md`](./ARCHITECTURE.md#backend--the-one-deployable-service)
for the package map. Dependencies point inward only: `apps/* → adapters → core → shared`.

### Where does my code go?

| If you are building… | Put it in… |
|---|---|
| Money/position rules, a ledger, a domain service | `packages/core` |
| A money primitive (amounts, ids, idempotency) | `packages/shared` |
| A client that talks to an external party (nTZS, DSE, CSD, KYC) | `packages/adapters` (implement a `core` port) |
| An HTTP endpoint, auth, a background job | `apps/api` |
| A screen for staff / clients | `apps/web-operator` / `apps/web-portal` |

`core` must never import `adapters`. Every adapter implements a port defined in `core` and has an
**in-memory reference stub in `core`** kept in lockstep, so the domain builds and tests offline.

## Branching & pull requests

- Branch off `main`: `feat/...`, `fix/...`, `chore/...`, `refactor/...`, `docs/...`.
- **Conventional Commits** (`feat(cash): ...`, `fix(ledger): ...`). Small, reviewable PRs.
- Open a PR into `main`. CI (lint, typecheck, test, build) must be green.
- **At least one approving review.** Changes under money/position paths additionally require an
  approval from a [`CODEOWNERS`](./CODEOWNERS) reviewer (segregation of duties — the author
  cannot self-approve a money-path change).
- No force-pushes to `main`; keep history linear. See **Branch protection** below.

## Definition of done (every PR)

From [`CLAUDE.md`](./CLAUDE.md):

- [ ] Tests written and passing (unit + integration; **money paths need integration tests against the nTZS test env**).
- [ ] Money-movement rules upheld; **idempotency + maker-checker covered by tests**.
- [ ] No secrets/PII in code or logs.
- [ ] Audit events emitted for any state change to money or positions.
- [ ] Adapter changes keep the in-memory stub in sync with the real implementation.
- [ ] No new dependency without justification (regulated system — minimise supply-chain surface).

## The money-movement non-negotiables

These are invariants. A PR that violates one must not be merged (full list in `CLAUDE.md`):

1. Idempotency on every financial operation.
2. Verify every nTZS webhook signature before acting.
3. Maker-checker on every money- or position-moving action (initiator ≠ approver), in the domain layer.
4. Money is integer minor units (`bigint`), never floats.
5. Append-only ledgers — corrections are reversing entries, never UPDATE/DELETE.
6. The nTZS tx reference is the source of truth for cash; reconcile daily.
7. Secrets only from env/secrets manager, backend-only; never logged.
8. Least-privilege RBAC + segregation of duties on every endpoint; default deny.

## Security

- Never commit secrets or PII. `.env` is git-ignored; only `.env.example` (placeholders) is tracked.
- Report a suspected vulnerability **privately** to the maintainers — do not open a public issue.
- Dual-use/security-sensitive changes need explicit reviewer sign-off.

## Code style

- TypeScript strict mode; Prettier + ESLint enforced in CI (`npm run lint`, `npm run format`).
- Prefer explicit, boring code over clever abstractions in money paths.
- Every money amount in code/DB states its unit (e.g. `amount_tzs_minor`).

## Branch protection (maintainers)

Recommended settings on `main` (GitHub → Settings → Branches, or `gh api`):

- Require a pull request before merging; require **1+ approvals** and **CODEOWNERS review**.
- Require status checks to pass (the CI workflow) and branches to be up to date.
- Dismiss stale approvals on new commits; require conversation resolution.
- Restrict force-pushes and deletions; require linear history.
