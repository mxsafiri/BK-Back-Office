import type { EventStore } from "../ledger/eventStore.js";
import { type Money, tzs } from "../../shared/money.js";

/**
 * Cash mirror (CLAUDE.md rule #6): our cash ledger MIRRORS nTZS. nTZS is the source of truth;
 * this is an append-only projection of the cash movements nTZS has confirmed (via webhooks).
 * The daily reconciliation job proves this mirror matches live nTZS balances and alerts on drift.
 *
 * Append-only: every confirmed movement is a new entry referencing the nTZS tx ref. We never
 * UPDATE/DELETE. Amounts are integer TZS minor units, stored as strings (bigint isn't JSON-safe).
 */
const STREAM = "cashmirror";

export interface CashMirrorEntry {
  readonly userId: string;
  /** Signed integer TZS: positive credit, negative debit. */
  readonly amountTzsMinor: bigint;
  /** nTZS on-chain tx reference — source of truth for this movement. */
  readonly txRef: string;
  /** Originating webhook event id (also the dedup key upstream). */
  readonly eventId: string;
  /** Movement reason, e.g. the webhook event type. */
  readonly reason: string;
}

export class CashMirror {
  constructor(private readonly events: EventStore) {}

  async record(entry: CashMirrorEntry): Promise<void> {
    await this.events.append(STREAM, [
      {
        type: "CashMirrored",
        payload: {
          userId: entry.userId,
          amountTzsMinor: entry.amountTzsMinor.toString(),
          txRef: entry.txRef,
          eventId: entry.eventId,
          reason: entry.reason,
        },
      },
    ]);
  }

  /** Mirrored balance for one nTZS user (sum of confirmed movements). */
  async balance(userId: string): Promise<Money> {
    const all = await this.events.read(STREAM);
    let total = 0n;
    for (const e of all) {
      if (e.type !== "CashMirrored") continue;
      if (e.payload["userId"] !== userId) continue;
      total += BigInt(e.payload["amountTzsMinor"] as string);
    }
    return tzs(total);
  }

  /** All mirrored balances keyed by nTZS user id (used by reconciliation). */
  async balances(): Promise<Map<string, Money>> {
    const all = await this.events.read(STREAM);
    const totals = new Map<string, bigint>();
    for (const e of all) {
      if (e.type !== "CashMirrored") continue;
      const userId = e.payload["userId"] as string;
      const amt = BigInt(e.payload["amountTzsMinor"] as string);
      totals.set(userId, (totals.get(userId) ?? 0n) + amt);
    }
    return new Map([...totals].map(([k, v]) => [k, tzs(v)]));
  }
}
