import type { EventStore } from "../ledger/eventStore.js";
import type { AccountId } from "../../shared/ids.js";
import { InsufficientHoldingsError, ValidationError } from "../../shared/errors.js";

/**
 * Holdings sub-ledger (CLAUDE.md Phase 1): the per-account securities position store, kept as
 * an APPEND-ONLY log of quantity movements on top of the event store. Positions are a
 * projection (the sum of entries). Corrections are reversing entries that reference the
 * original — never an UPDATE/DELETE (rule #5).
 *
 * Quantities are INTEGER shares (bigint). DSE equities trade in whole shares; never floats.
 * Cash accounts may not go short, so a debit that would take a position below zero is refused.
 */
export interface HoldingEntry {
  readonly accountId: AccountId;
  /** DSE instrument code, e.g. "CRDB", "TBL". */
  readonly instrument: string;
  /** Signed integer shares: positive = credit (acquire), negative = debit (dispose). */
  readonly quantity: bigint;
  /** Why this movement happened, e.g. "execution:trd_…", "corpaction:bonus:…". */
  readonly reason: string;
  /** Originating id (trade/execution/corporate-action) for traceability. */
  readonly ref?: string;
}

function streamFor(accountId: AccountId): string {
  return `holdings:${accountId}`;
}

export class HoldingsLedger {
  constructor(private readonly events: EventStore) {}

  /**
   * Post a securities movement. Reads the current position first and refuses an oversell.
   *
   * NOTE: read-then-append is atomic only under the event store's per-stream optimistic
   * concurrency (production = Postgres). The in-memory store is single-threaded so this holds
   * for tests; the production store must enforce it on (streamId, seq).
   */
  async post(entry: HoldingEntry): Promise<void> {
    if (entry.quantity === 0n) {
      throw new ValidationError("Holding entry quantity must be non-zero.");
    }
    if (entry.quantity < 0n) {
      const current = await this.position(entry.accountId, entry.instrument);
      if (current + entry.quantity < 0n) {
        throw new InsufficientHoldingsError(
          `Debit of ${-entry.quantity} ${entry.instrument} exceeds position ${current} for ${entry.accountId}.`,
        );
      }
    }
    await this.events.append(streamFor(entry.accountId), [
      {
        type: "HoldingPosted",
        payload: {
          accountId: entry.accountId,
          instrument: entry.instrument,
          quantity: entry.quantity.toString(), // bigint is not JSON-serialisable; store as string
          reason: entry.reason,
          ...(entry.ref ? { ref: entry.ref } : {}),
        },
      },
    ]);
  }

  /** Current position in one instrument for an account (sum of entries). */
  async position(accountId: AccountId, instrument: string): Promise<bigint> {
    const stored = await this.events.read(streamFor(accountId));
    let total = 0n;
    for (const e of stored) {
      if (e.type !== "HoldingPosted") continue;
      if (e.payload["instrument"] !== instrument) continue;
      total += BigInt(e.payload["quantity"] as string);
    }
    return total;
  }

  /** All non-zero positions for an account, keyed by instrument code. */
  async positions(accountId: AccountId): Promise<Map<string, bigint>> {
    const stored = await this.events.read(streamFor(accountId));
    const totals = new Map<string, bigint>();
    for (const e of stored) {
      if (e.type !== "HoldingPosted") continue;
      const instrument = e.payload["instrument"] as string;
      const qty = BigInt(e.payload["quantity"] as string);
      totals.set(instrument, (totals.get(instrument) ?? 0n) + qty);
    }
    for (const [k, v] of totals) if (v === 0n) totals.delete(k);
    return totals;
  }
}
