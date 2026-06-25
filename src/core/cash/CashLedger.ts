import type { Money } from "../../shared/money.js";

/**
 * CashLedger (CLAUDE.md architecture): the cash store sits behind this interface so the
 * backing store (nTZS-only vs nTZS + bank trust account) can change without rewriting the
 * back office. The custody design is BLOCKED pending the CMSA ruling — program to this
 * interface, do not hardcode a backing store into the domain.
 *
 * The nTZS-backed implementation lives in adapters/ntzs. We NEVER move shillings directly;
 * every method maps to an nTZS API call and records the returned on-chain tx reference.
 */
export interface CashRef {
  /** nTZS transaction id / on-chain reference — source of truth for the cash leg. */
  readonly txRef: string;
  readonly status: "completed" | "requested" | "submitted";
}

export interface CashLedger {
  /** Provision a client cash account (nTZS subwallet). Returns the nTZS user id to store. */
  provisionAccount(externalId: string, email: string): Promise<{ userId: string; walletAddress: string }>;

  /** Live balance — read fresh before every transfer/withdrawal. */
  getBalance(userId: string): Promise<Money>;

  /**
   * On-ramp: mint nTZS 1:1 from mobile money/card. `collectToTreasury: true` mints into the
   * treasury (escrow flows) rather than the client wallet. May settle asynchronously — handle
   * the returned status, do not assume instant completion.
   */
  deposit(params: {
    userId: string;
    amount: Money;
    phoneNumber: string;
    collectToTreasury?: boolean;
    idempotencyKey: string;
  }): Promise<CashRef>;

  /** Move funds between two platform accounts (client <-> treasury sub-wallet). */
  transfer(params: {
    fromUserId: string;
    toUserId: string;
    amount: Money;
    idempotencyKey: string;
  }): Promise<CashRef>;

  /** Off-ramp to mobile money. >= 1,000,000 TZS may return status "requested" (admin approval). */
  withdraw(params: {
    userId: string;
    amount: Money;
    phoneNumber: string;
    idempotencyKey: string;
  }): Promise<CashRef>;
}
