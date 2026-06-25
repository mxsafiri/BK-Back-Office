import {
  InMemoryEventStore,
  AuditLog,
  InMemoryCashLedger,
  InMemoryAccountStore,
  StubKycProvider,
  CashMirror,
  CashReconciliationJob,
  CollectingAlerter,
  MakerCheckerRegistry,
  OnboardingService,
  type CashLedger,
  type AccountStore,
} from "@fimco/core";
import { InMemoryIdempotencyStore } from "@fimco/shared";
import { NtzsWebhookReceiver } from "@fimco/adapters";
import type { ApiConfig } from "./config.js";

/**
 * Composition root. Wires the in-memory implementations so the service runs and is testable
 * offline. Production swaps:
 *   - InMemoryCashLedger      -> NtzsCashLedger (real nTZS API)
 *   - InMemory* stores        -> Postgres-backed stores (idempotency key in the same txn)
 *   - CollectingAlerter       -> a real notify adapter (PagerDuty/Slack/email)
 * The HTTP and domain code does not change — only what we construct here.
 */
export interface Container {
  readonly cash: CashLedger;
  readonly accounts: AccountStore;
  readonly audit: AuditLog;
  readonly mirror: CashMirror;
  readonly onboarding: OnboardingService;
  readonly receiver: NtzsWebhookReceiver;
  readonly reconciliation: CashReconciliationJob;
  readonly makerChecker: MakerCheckerRegistry;
}

export function buildContainer(config: ApiConfig): Container {
  const events = new InMemoryEventStore();
  const audit = new AuditLog(events);
  const cash = new InMemoryCashLedger();
  const accounts = new InMemoryAccountStore();
  const kyc = new StubKycProvider();
  const mirror = new CashMirror(events);
  const idem = new InMemoryIdempotencyStore();

  const onboarding = new OnboardingService({ kyc, cash, accounts, audit });
  const receiver = new NtzsWebhookReceiver({ secret: config.ntzs.webhookSecret, mirror, audit, idem });
  const reconciliation = new CashReconciliationJob({ cash, mirror, audit, alerter: new CollectingAlerter() });
  const makerChecker = new MakerCheckerRegistry(audit);

  return { cash, accounts, audit, mirror, onboarding, receiver, reconciliation, makerChecker };
}
