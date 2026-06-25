/**
 * FIMCO Broker Back Office — composition root (Phase 1: cash & ledger core).
 * Public surface of the cash & ledger core. The in-memory/stub implementations let the core run
 * and be tested before live DSE/CSD/nTZS access exists; swap in real adapters as discovery
 * answers land (the nTZS adapter is real and runs against the TEST environment).
 */
export * from "./shared/index.js";
export { InMemoryEventStore } from "./core/ledger/eventStore.js";
export type { DomainEvent, StoredEvent, EventStore } from "./core/ledger/eventStore.js";
export { SecuritiesLedger } from "./core/ledger/securitiesLedger.js";
export type { Order, Execution, OrderSide, OrderStatus } from "./core/ledger/securitiesLedger.js";
export { AuditLog } from "./core/controls/auditLog.js";
export { MakerCheckerRegistry } from "./core/controls/makerChecker.js";
export type { CashLedger, CashRef } from "./core/cash/CashLedger.js";
export { Treasury, TREASURY_PURPOSES } from "./core/cash/treasury.js";
export type { TreasuryPurpose, TreasuryWalletMap } from "./core/cash/treasury.js";
export { InMemoryCashLedger } from "./adapters/ntzs/inMemoryCashLedger.js";
export { NtzsCashLedger } from "./adapters/ntzs/ntzsCashLedger.js";
export type { NtzsConfig } from "./adapters/ntzs/ntzsCashLedger.js";
export { verifyNtzsWebhook } from "./adapters/ntzs/webhook.js";
export type { NtzsWebhookEvent } from "./adapters/ntzs/webhook.js";
export { NtzsWebhookReceiver } from "./adapters/ntzs/webhookReceiver.js";
export type { NtzsWebhookDelivery, WebhookOutcome } from "./adapters/ntzs/webhookReceiver.js";
export { CashMirror } from "./core/cash/cashMirror.js";
export type { CashMirrorEntry } from "./core/cash/cashMirror.js";

// reconciliation
export { CashReconciliationJob, CollectingAlerter } from "./core/reconciliation/cashReconciliation.js";
export type { Alerter, ReconciliationReport, AccountReconResult } from "./core/reconciliation/cashReconciliation.js";

// accounts
export { InMemoryAccountStore, canTransact } from "./core/accounts/account.js";
export type { ClientAccount, AccountStatus, AccountStore } from "./core/accounts/account.js";
export { HoldingsLedger } from "./core/accounts/holdings.js";
export type { HoldingEntry } from "./core/accounts/holdings.js";
export { OnboardingService } from "./core/accounts/onboarding.js";
export type { OnboardInput, OnboardOutcome } from "./core/accounts/onboarding.js";

// kyc
export { StubKycProvider } from "./adapters/kyc/stubKycProvider.js";
export type { KycProvider, KycApplicant, KycResult, KycDecision, KycMethod } from "./adapters/kyc/KycProvider.js";

export const VERSION = "0.0.1";
