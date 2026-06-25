import type { CashLedger, CashRef } from "./CashLedger.js";
import { type Money, tzs, subtract, add, gte } from "@fimco/shared";
import { InsufficientFundsError } from "@fimco/shared";

/**
 * In-memory CashLedger stub — stands in for the nTZS adapter so the core builds and tests
 * without live access (CLAUDE.md: every adapter is independently stubbable). The real
 * nTZS implementation will call POST /users, /transfers, /withdrawals and record tx refs.
 *
 * NOTE: this stub keeps balances in TZS only; it exists for tests, not production.
 */
export class InMemoryCashLedger implements CashLedger {
  private readonly balances = new Map<string, Money>();
  private seq = 0;

  seed(userId: string, amount: Money): void {
    this.balances.set(userId, amount);
  }

  async provisionAccount(externalId: string): Promise<{ userId: string; walletAddress: string }> {
    const userId = `ntzs_${externalId}`;
    if (!this.balances.has(userId)) this.balances.set(userId, tzs(0));
    return { userId, walletAddress: `0x${externalId.padStart(40, "0")}` };
  }

  async getBalance(userId: string): Promise<Money> {
    return this.balances.get(userId) ?? tzs(0);
  }

  async deposit(params: {
    userId: string;
    amount: Money;
    phoneNumber: string;
    collectToTreasury?: boolean;
    idempotencyKey: string;
  }): Promise<CashRef> {
    // On-ramp mints nTZS 1:1; the stub credits the target wallet immediately.
    const bal = await this.getBalance(params.userId);
    this.balances.set(params.userId, add(bal, params.amount));
    return { txRef: `0xstubdeposit${this.seq++}`, status: "completed" };
  }

  async transfer(params: {
    fromUserId: string;
    toUserId: string;
    amount: Money;
    idempotencyKey: string;
  }): Promise<CashRef> {
    const from = await this.getBalance(params.fromUserId);
    if (!gte(from, params.amount)) {
      throw new InsufficientFundsError(`Insufficient balance for ${params.fromUserId}`);
    }
    this.balances.set(params.fromUserId, subtract(from, params.amount));
    this.balances.set(params.toUserId, add(await this.getBalance(params.toUserId), params.amount));
    return { txRef: `0xstubtransfer${this.seq++}`, status: "completed" };
  }

  async withdraw(params: {
    userId: string;
    amount: Money;
    phoneNumber: string;
    idempotencyKey: string;
  }): Promise<CashRef> {
    const bal = await this.getBalance(params.userId);
    if (!gte(bal, params.amount)) {
      throw new InsufficientFundsError(`Insufficient balance for ${params.userId}`);
    }
    this.balances.set(params.userId, subtract(bal, params.amount));
    // Mirror nTZS: >= 1,000,000 TZS requires admin approval -> async "requested".
    const status = params.amount.minor >= 1_000_000n ? "requested" : "completed";
    return { txRef: `0xstubwithdraw${this.seq++}`, status };
  }
}
