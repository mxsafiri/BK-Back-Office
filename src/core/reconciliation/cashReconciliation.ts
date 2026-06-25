import type { CashLedger } from "../cash/CashLedger.js";
import type { CashMirror } from "../cash/cashMirror.js";
import type { AuditLog } from "../controls/auditLog.js";

/**
 * Daily cash reconciliation (CLAUDE.md rule #6 + Phase 1 exit): prove our cash mirror matches
 * live nTZS balances and alert on ANY drift. nTZS is the source of truth — a break means our
 * mirror is wrong (a missed/duplicated webhook, a bug) and must be investigated, never silently
 * "corrected" toward the mirror.
 *
 * The job is read-only: it reads live balances and the mirror, reports, and alerts. It never
 * moves money and never mutates the mirror (which is append-only anyway).
 */
export interface Alerter {
  alert(message: string, meta?: Readonly<Record<string, unknown>>): Promise<void>;
}

/** Collects alerts in memory — for tests and local runs. Production wires a notify adapter. */
export class CollectingAlerter implements Alerter {
  readonly alerts: { message: string; meta?: Readonly<Record<string, unknown>> }[] = [];
  async alert(message: string, meta?: Readonly<Record<string, unknown>>): Promise<void> {
    this.alerts.push(meta ? { message, meta } : { message });
  }
}

export type ReconStatus = "matched" | "break" | "error";

export interface AccountReconResult {
  readonly userId: string;
  readonly mirrorMinor: bigint;
  /** Live nTZS balance; absent if the balance read errored. */
  readonly liveMinor?: bigint;
  /** live - mirror, in TZS minor units; absent on error. */
  readonly driftMinor?: bigint;
  readonly status: ReconStatus;
  readonly error?: string;
}

export interface ReconciliationReport {
  readonly checked: number;
  readonly results: readonly AccountReconResult[];
  readonly breaks: readonly AccountReconResult[];
  readonly errors: readonly AccountReconResult[];
  /** True when every account matched (no breaks, no errors). */
  readonly ok: boolean;
}

export class CashReconciliationJob {
  constructor(
    private readonly deps: {
      cash: CashLedger;
      mirror: CashMirror;
      audit: AuditLog;
      alerter: Alerter;
    },
  ) {}

  /**
   * Reconcile the given nTZS user ids (client cash wallets + treasury sub-wallets). The caller
   * assembles the id list from the account store and the treasury wallet map.
   */
  async run(userIds: readonly string[]): Promise<ReconciliationReport> {
    const { cash, mirror, audit, alerter } = this.deps;
    const results: AccountReconResult[] = [];

    for (const userId of userIds) {
      const mirrorMinor = (await mirror.balance(userId)).minor;
      try {
        const live = await cash.getBalance(userId);
        const liveMinor = live.minor;
        const driftMinor = liveMinor - mirrorMinor;
        results.push({
          userId,
          mirrorMinor,
          liveMinor,
          driftMinor,
          status: driftMinor === 0n ? "matched" : "break",
        });
      } catch (err) {
        results.push({
          userId,
          mirrorMinor,
          status: "error",
          error: err instanceof Error ? err.message : "balance read failed",
        });
      }
    }

    const breaks = results.filter((r) => r.status === "break");
    const errors = results.filter((r) => r.status === "error");
    const ok = breaks.length === 0 && errors.length === 0;

    for (const b of breaks) {
      await audit.record({
        action: "reconciliation.break",
        actor: "system",
        subject: b.userId,
        meta: { mirrorMinor: b.mirrorMinor.toString(), liveMinor: b.liveMinor?.toString(), driftMinor: b.driftMinor?.toString() },
      });
    }
    for (const e of errors) {
      await audit.record({
        action: "reconciliation.error",
        actor: "system",
        subject: e.userId,
        meta: { error: e.error },
      });
    }
    await audit.record({
      action: "reconciliation.completed",
      actor: "system",
      subject: "cash",
      meta: { checked: results.length, breaks: breaks.length, errors: errors.length, ok },
    });

    if (!ok) {
      await alerter.alert(
        `Cash reconciliation drift: ${breaks.length} break(s), ${errors.length} error(s) across ${results.length} account(s).`,
        { breaks: breaks.length, errors: errors.length },
      );
    }

    return { checked: results.length, results, breaks, errors, ok };
  }
}
