/**
 * @fimco/core — the modular-monolith domain: ports, domain logic, and in-memory reference
 * implementations. Depends only on @fimco/shared. Holds ALL money/position logic. Real
 * outside-world integrations live in @fimco/adapters; this package is fully testable offline.
 */

// ledger
export { InMemoryEventStore } from "./ledger/eventStore.js";
export type { DomainEvent, StoredEvent, EventStore } from "./ledger/eventStore.js";
export { SecuritiesLedger } from "./ledger/securitiesLedger.js";
export type { Order, Execution, OrderSide, OrderStatus } from "./ledger/securitiesLedger.js";

// controls
export { AuditLog } from "./controls/auditLog.js";
export type { AuditEntry } from "./controls/auditLog.js";
export { MakerCheckerRegistry } from "./controls/makerChecker.js";
export type { ApprovalRequest, RequestStatus } from "./controls/makerChecker.js";

// cash
export type { CashLedger, CashRef } from "./cash/CashLedger.js";
export { InMemoryCashLedger } from "./cash/inMemoryCashLedger.js";
export { Treasury, TREASURY_PURPOSES } from "./cash/treasury.js";
export type { TreasuryPurpose, TreasuryWalletMap } from "./cash/treasury.js";
export { CashMirror } from "./cash/cashMirror.js";
export type { CashMirrorEntry } from "./cash/cashMirror.js";

// accounts
export { InMemoryAccountStore, canTransact } from "./accounts/account.js";
export type { ClientAccount, AccountStatus, AccountStore } from "./accounts/account.js";
export { HoldingsLedger } from "./accounts/holdings.js";
export type { HoldingEntry } from "./accounts/holdings.js";
export { OnboardingService } from "./accounts/onboarding.js";
export type { OnboardInput, OnboardOutcome } from "./accounts/onboarding.js";

// reconciliation
export { CashReconciliationJob, CollectingAlerter } from "./reconciliation/cashReconciliation.js";
export type { Alerter, ReconciliationReport, AccountReconResult, ReconStatus } from "./reconciliation/cashReconciliation.js";

// kyc
export { StubKycProvider } from "./kyc/stubKycProvider.js";
export type { StubKycOptions } from "./kyc/stubKycProvider.js";
export type { KycProvider, KycApplicant, KycResult, KycDecision, KycMethod, BankReference } from "./kyc/KycProvider.js";
