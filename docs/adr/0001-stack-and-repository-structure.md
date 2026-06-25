# ADR 0001 — Stack and repository structure

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** FIMCO engineering (owner: @mxsafiri)

## Context

FIMCO Broker Back Office is a regulated, money-moving back office for the DSE ecosystem. We need
a codebase that (a) keeps the ledger consistent and auditable, (b) keeps all money logic and
secrets server-side, and (c) can be **handed over to other developers** to contribute to and
operate. It needs a backend, two user-facing surfaces (staff console + client portal), and shared
money types between them.

## Decision

1. **Modular monolith backend, one deployable Node service.** One transactional Postgres DB is the
   system of record (CLAUDE.md). Easier to keep the ledger consistent and to audit than microservices.
2. **Monorepo via npm workspaces** with strictly inward dependencies `apps/* → adapters → core → shared`.
   - `shared` — money (integer minor units), ids, idempotency, errors.
   - `core` — domain ports + logic + **in-memory reference implementations** (testable offline).
   - `adapters` — real outside-world integrations (nTZS HTTP, webhooks; DSE/CSD/KYC later).
   - `apps/api`, `apps/web-operator`, `apps/web-portal`, plus `packages/api-client` and `packages/ui`.
3. **Backend HTTP framework: Fastify.** Lightweight, TypeScript-first, JSON-Schema validation,
   small dependency surface — fits "minimise supply-chain surface" and "explicit, boring code in
   money paths."
4. **Frontend: Next.js, two separate apps** (operator console + client portal) sharing a UI library
   and a typed `api-client`. Separate deployables because the portal is internet-facing and the
   console is internal — different trust zones.
5. **Ports & adapters.** Every external party sits behind a `core` port with an in-memory stub kept
   in lockstep, so the core builds and tests without live DSE/CSD/nTZS access.
6. **Frontend is presentation only.** No money logic, authorization-of-record, or secrets in the
   browser; everything is enforced server-side.

## Alternatives considered

- **Backend: NestJS** — more enforced structure (good for large teams) but heavier, many more
  dependencies to audit, and decorator "magic" that sits awkwardly with explicit money-path code.
- **Backend: Express** — ubiquitous but dated, weaker TypeScript story, more hand-written glue.
- **Frontend: Vite SPA** — simpler and lighter (recommended by engineering), but the team chose
  Next.js for its conventions and future SSR optionality. Accepted trade-off: a Node runtime to
  operate for the UI.
- **One role-gated frontend app** — less to build, but mixes the internet-facing surface with
  internal tooling in one deployable; rejected on security grounds.
- **Separate frontend/backend repos** — cleaner deploy isolation but duplicated tooling and no
  shared types; rejected for a small team.

## Consequences

**Positive:** shared types across backend and frontend; one CI; clear, enforceable module
boundaries; the domain is testable offline; new contributors have an obvious place for each kind
of change (see CONTRIBUTING.md).

**Negative / costs:** monorepo TypeScript tooling (project references, path aliases) is more setup;
Next.js adds a runtime and dependency weight to the frontends (isolated from the backend's audit
surface by the workspace boundary); the ports/adapters indirection is extra structure (justified
by the regulatory need to stub external parties).

**Follow-ups:** replace in-memory stores with Postgres + migrations; wire OIDC/SSO + RBAC at the
`apps/api` edge; finalise hosting/data-residency once the CMSA ruling lands (Discovery item 1).
