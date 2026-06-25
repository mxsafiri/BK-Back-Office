import { newId, type AccountId, type ClientId } from "@fimco/shared";
import type { CashLedger } from "../cash/CashLedger.js";
import type { AuditLog } from "../controls/auditLog.js";
import type { KycApplicant, KycProvider, KycResult } from "../kyc/KycProvider.js";
import { type AccountStore, type ClientAccount } from "./account.js";
import { ValidationError } from "@fimco/shared";

/**
 * Onboarding (CLAUDE.md Phase 1 exit: onboard a test client, with a full audit trail).
 *
 * Flow: KYC -> (if not rejected) provision the cash leg (nTZS subwallet) -> open the account.
 *  - KYC "verified" -> account opens ACTIVE.
 *  - KYC "review"   -> account opens PENDING; a human activates it (see activate()).
 *  - KYC "rejected" / "pending" -> no cash wallet is provisioned, no account is opened.
 *
 * Every step emits an audit event. We provision the wallet only after KYC clears so we never
 * create cash infrastructure for a rejected applicant.
 */
export interface OnboardInput {
  readonly clientId: ClientId;
  /** Our stable id for this client, passed to nTZS as externalId. */
  readonly externalId: string;
  readonly email: string;
  readonly applicant: KycApplicant;
}

export interface OnboardOutcome {
  readonly kyc: KycResult;
  /** Present unless KYC was rejected/pending. */
  readonly account?: ClientAccount;
}

export class OnboardingService {
  constructor(
    private readonly deps: {
      kyc: KycProvider;
      cash: CashLedger;
      accounts: AccountStore;
      audit: AuditLog;
    },
  ) {}

  async onboard(input: OnboardInput): Promise<OnboardOutcome> {
    const { kyc, cash, accounts, audit } = this.deps;

    const result = await kyc.verify(input.applicant);
    await audit.record({
      action: "kyc.verified",
      actor: "system",
      subject: input.clientId,
      meta: { decision: result.decision, method: result.method, reference: result.reference },
    });

    if (result.decision === "rejected" || result.decision === "pending") {
      // Do not provision a wallet or open an account for a non-cleared applicant.
      return { kyc: result };
    }

    // Provision the cash leg; store nTZS's `id` as the linkage (never our externalId).
    const { userId } = await cash.provisionAccount(input.externalId, input.email);

    const account: ClientAccount = {
      id: newId("acc"),
      clientId: input.clientId,
      cashUserId: userId,
      kycReference: result.reference,
      status: result.decision === "verified" ? "active" : "pending",
      openedAt: new Date().toISOString(),
    };
    await accounts.create(account);
    await audit.record({
      action: "account.opened",
      actor: "system",
      subject: account.id,
      meta: { clientId: account.clientId, status: account.status, kycReference: account.kycReference },
    });

    return { kyc: result, account };
  }

  /**
   * Activate a PENDING account (e.g. after a manual KYC review clears). Emits an audit event.
   *
   * NOTE: in production this is a control action that should run through maker-checker
   * (initiator != approver). The activation reason and actor are recorded here.
   */
  async activate(accountId: AccountId, actor: string, reason: string): Promise<ClientAccount> {
    const { accounts, audit } = this.deps;
    const account = await accounts.get(accountId);
    if (!account) throw new ValidationError(`Unknown account ${accountId}`);
    if (account.status !== "pending") {
      throw new ValidationError(`Account ${accountId} is ${account.status}, not pending; cannot activate.`);
    }
    const activated: ClientAccount = { ...account, status: "active" };
    await accounts.put(activated);
    await audit.record({
      action: "account.activated",
      actor,
      subject: accountId,
      meta: { reason, from: "pending", to: "active" },
    });
    return activated;
  }
}
