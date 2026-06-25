<!-- Keep PRs small and reviewable. See CONTRIBUTING.md and CLAUDE.md. -->

## What & why

<!-- What does this change do, and why? Link any issue / discovery item. -->

## Type

- [ ] feat  - [ ] fix  - [ ] refactor  - [ ] chore  - [ ] docs

## Definition of done

- [ ] Tests written and passing (unit + integration). **Money paths have integration tests against the nTZS test env.**
- [ ] CI green: lint, typecheck, test, build.
- [ ] No secrets or PII in code, logs, or fixtures.
- [ ] Audit events emitted for any state change to money or positions.
- [ ] Adapter change keeps the in-memory stub in lockstep with the real implementation.
- [ ] No new dependency without justification.

## Money-movement rules (tick all that apply, or N/A)

- [ ] Idempotency on every financial operation, covered by a test.
- [ ] Maker-checker enforced (initiator ≠ approver) in the domain layer, covered by a test.
- [ ] nTZS webhook signatures verified before acting.
- [ ] Money handled as integer minor units (`bigint`) — no floats.
- [ ] Ledgers append-only — corrections are reversing entries.
- [ ] Secrets only from env, backend-only, never logged.
- [ ] N/A — this PR does not touch money or positions.

## Notes for reviewers

<!-- Anything that needs extra scrutiny, risk areas, manual test steps. -->
