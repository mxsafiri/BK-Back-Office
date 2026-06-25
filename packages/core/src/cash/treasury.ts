import type { CashLedger, CashRef } from "./CashLedger.js";
import type { Money } from "@fimco/shared";
import { ValidationError } from "@fimco/shared";

/**
 * Treasury sub-wallet topology (CLAUDE.md money layer). Firm funds live in HD-derived,
 * partner-controlled nTZS sub-wallets, segregated by PURPOSE. Client money never mixes with
 * firm money, and firm money never mixes across purposes.
 *
 *  - escrow:       buyer cash locked when a buy order is accepted; released at settlement
 *  - settlement:   netting float that settles the cash leg each cycle
 *  - reserves:     capital that would back a T+0 settlement advance (see BLOCKED below)
 *  - disbursement: outbound client payouts (settled sell proceeds, withdrawals)
 *  - fees:         brokerage + DSE/CMSA levies + taxes collected
 *
 * BLOCKED (CLAUDE.md): paying a seller at T+0 from `reserves` before the CSD confirms the
 * stock leg is a settlement advance and is NOT permitted until the CMSA ruling lands. This
 * module deliberately provides no advance helper and `disburse()` REFUSES to pay out of
 * `reserves`. Do not lift this guard until the discovery answer is recorded.
 */
export const TREASURY_PURPOSES = [
  "escrow",
  "settlement",
  "reserves",
  "disbursement",
  "fees",
] as const;

export type TreasuryPurpose = (typeof TREASURY_PURPOSES)[number];

/** Maps each treasury purpose to its nTZS user/wallet id. Sourced from secrets/config. */
export type TreasuryWalletMap = Readonly<Record<TreasuryPurpose, string>>;

export class Treasury {
  private readonly wallets: TreasuryWalletMap;

  constructor(
    private readonly cash: CashLedger,
    wallets: TreasuryWalletMap,
  ) {
    // Fail fast: every purpose must be configured, and no two purposes may share a wallet
    // (sharing a wallet would defeat segregation of firm funds).
    const seen = new Set<string>();
    for (const purpose of TREASURY_PURPOSES) {
      const id = wallets[purpose];
      if (!id) {
        throw new ValidationError(`Treasury wallet not configured for purpose "${purpose}".`);
      }
      if (seen.has(id)) {
        throw new ValidationError(`Treasury wallet "${id}" reused; purposes must be segregated.`);
      }
      seen.add(id);
    }
    this.wallets = wallets;
  }

  /** Resolve a purpose to its nTZS user id. */
  userId(purpose: TreasuryPurpose): string {
    return this.wallets[purpose];
  }

  /** Live balance of a treasury sub-wallet (reads through to nTZS). */
  balanceOf(purpose: TreasuryPurpose): Promise<Money> {
    return this.cash.getBalance(this.wallets[purpose]);
  }

  /**
   * Move firm funds between two treasury sub-wallets (e.g. escrow -> settlement at the
   * settlement cycle). Caller wraps this in maker-checker + idempotency + audit.
   */
  async move(params: {
    from: TreasuryPurpose;
    to: TreasuryPurpose;
    amount: Money;
    idempotencyKey: string;
  }): Promise<CashRef> {
    if (params.from === params.to) {
      throw new ValidationError(`Treasury move must cross purposes (got ${params.from} -> ${params.from}).`);
    }
    return this.cash.transfer({
      fromUserId: this.wallets[params.from],
      toUserId: this.wallets[params.to],
      amount: params.amount,
      idempotencyKey: params.idempotencyKey,
    });
  }

  /** Collect funds from a client account into a treasury sub-wallet (e.g. escrow lock, fee skim). */
  collect(params: {
    fromClientUserId: string;
    to: TreasuryPurpose;
    amount: Money;
    idempotencyKey: string;
  }): Promise<CashRef> {
    return this.cash.transfer({
      fromUserId: params.fromClientUserId,
      toUserId: this.wallets[params.to],
      amount: params.amount,
      idempotencyKey: params.idempotencyKey,
    });
  }

  /**
   * Pay funds out of a treasury sub-wallet to a client account (e.g. settled sell proceeds).
   *
   * REFUSES to pay out of `reserves`: that would be a T+0 settlement advance, which is BLOCKED
   * pending the CMSA ruling (CLAUDE.md). Settled payouts come from `disbursement`/`settlement`.
   */
  async disburse(params: {
    from: TreasuryPurpose;
    toClientUserId: string;
    amount: Money;
    idempotencyKey: string;
  }): Promise<CashRef> {
    if (params.from === "reserves") {
      throw new ValidationError(
        "Disbursing from reserves is a T+0 settlement advance — BLOCKED pending the CMSA ruling (see CLAUDE.md).",
      );
    }
    return this.cash.transfer({
      fromUserId: this.wallets[params.from],
      toUserId: params.toClientUserId,
      amount: params.amount,
      idempotencyKey: params.idempotencyKey,
    });
  }
}
