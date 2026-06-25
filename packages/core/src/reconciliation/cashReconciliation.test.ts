import { describe, it, expect } from "vitest";
import { CashReconciliationJob, CollectingAlerter } from "./cashReconciliation.js";
import { CashMirror } from "../cash/cashMirror.js";
import { AuditLog } from "../controls/auditLog.js";
import { InMemoryEventStore } from "../ledger/eventStore.js";
import { InMemoryCashLedger } from "../cash/inMemoryCashLedger.js";
import { tzs } from "@fimco/shared";

function setup() {
  const events = new InMemoryEventStore();
  const mirror = new CashMirror(events);
  const audit = new AuditLog(events);
  const cash = new InMemoryCashLedger();
  const alerter = new CollectingAlerter();
  const job = new CashReconciliationJob({ cash, mirror, audit, alerter });
  return { events, mirror, audit, cash, alerter, job };
}

describe("CashReconciliationJob", () => {
  it("passes when the mirror matches live nTZS balances and raises no alert", async () => {
    const { mirror, cash, alerter, job } = setup();
    cash.seed("usr_a", tzs(100_000));
    await mirror.record({ userId: "usr_a", amountTzsMinor: 100_000n, txRef: "0x", eventId: "e1", reason: "deposit.completed" });

    const report = await job.run(["usr_a"]);

    expect(report.ok).toBe(true);
    expect(report.breaks).toHaveLength(0);
    expect(report.results[0]?.driftMinor).toBe(0n);
    expect(alerter.alerts).toHaveLength(0);
  });

  it("flags a break and alerts when live nTZS differs from the mirror", async () => {
    const { mirror, cash, alerter, audit, job } = setup();
    // Mirror thinks 100k; nTZS shows 90k (e.g. a fee we failed to mirror) -> drift -10k.
    cash.seed("usr_a", tzs(90_000));
    await mirror.record({ userId: "usr_a", amountTzsMinor: 100_000n, txRef: "0x", eventId: "e1", reason: "deposit.completed" });

    const report = await job.run(["usr_a"]);

    expect(report.ok).toBe(false);
    expect(report.breaks).toHaveLength(1);
    expect(report.breaks[0]?.driftMinor).toBe(-10_000n);
    expect(alerter.alerts).toHaveLength(1);
    const actions = (await audit.entries()).map((e) => e.action);
    expect(actions).toContain("reconciliation.break");
    expect(actions).toContain("reconciliation.completed");
  });

  it("reconciles many accounts and isolates the breaks", async () => {
    const { mirror, cash, job } = setup();
    cash.seed("a", tzs(10n));
    cash.seed("b", tzs(20n));
    cash.seed("c", tzs(999n)); // break
    await mirror.record({ userId: "a", amountTzsMinor: 10n, txRef: "x", eventId: "1", reason: "r" });
    await mirror.record({ userId: "b", amountTzsMinor: 20n, txRef: "x", eventId: "2", reason: "r" });
    await mirror.record({ userId: "c", amountTzsMinor: 30n, txRef: "x", eventId: "3", reason: "r" });

    const report = await job.run(["a", "b", "c"]);

    expect(report.checked).toBe(3);
    expect(report.breaks.map((b) => b.userId)).toEqual(["c"]);
  });

  it("records an error (not a false match) when a balance read fails", async () => {
    const { mirror, audit, alerter } = setup();
    const failingCash = {
      async getBalance() {
        throw new Error("nTZS unavailable");
      },
    } as unknown as InMemoryCashLedger;
    const job = new CashReconciliationJob({ cash: failingCash, mirror, audit, alerter });
    await mirror.record({ userId: "usr_a", amountTzsMinor: 100n, txRef: "x", eventId: "1", reason: "r" });

    const report = await job.run(["usr_a"]);

    expect(report.ok).toBe(false);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.error).toContain("nTZS unavailable");
    expect(alerter.alerts).toHaveLength(1);
  });
});
