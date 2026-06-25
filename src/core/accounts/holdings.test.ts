import { describe, it, expect } from "vitest";
import { InMemoryEventStore } from "../ledger/eventStore.js";
import { HoldingsLedger } from "./holdings.js";
import { newId, type AccountId } from "../../shared/ids.js";
import { InsufficientHoldingsError, ValidationError } from "../../shared/errors.js";

function setup() {
  const events = new InMemoryEventStore();
  const holdings = new HoldingsLedger(events);
  const acc = newId("acc") as AccountId;
  return { events, holdings, acc };
}

describe("HoldingsLedger", () => {
  it("accumulates positions from append-only entries", async () => {
    const { holdings, acc } = setup();
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 100n, reason: "execution:trd_1" });
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 50n, reason: "execution:trd_2" });
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: -30n, reason: "execution:trd_3" });

    expect(await holdings.position(acc, "CRDB")).toBe(120n);
  });

  it("tracks instruments independently", async () => {
    const { holdings, acc } = setup();
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 100n, reason: "x" });
    await holdings.post({ accountId: acc, instrument: "TBL", quantity: 200n, reason: "y" });

    const positions = await holdings.positions(acc);
    expect(positions.get("CRDB")).toBe(100n);
    expect(positions.get("TBL")).toBe(200n);
  });

  it("refuses an oversell (no short positions on cash accounts)", async () => {
    const { holdings, acc } = setup();
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 40n, reason: "buy" });
    await expect(
      holdings.post({ accountId: acc, instrument: "CRDB", quantity: -50n, reason: "sell" }),
    ).rejects.toBeInstanceOf(InsufficientHoldingsError);
    expect(await holdings.position(acc, "CRDB")).toBe(40n);
  });

  it("supports reversing corrections that net to the corrected position", async () => {
    const { holdings, acc } = setup();
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 100n, reason: "execution:trd_1" });
    // Mistaken extra credit, then a reversing entry referencing it.
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 10n, reason: "error", ref: "trd_bad" });
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: -10n, reason: "reversal", ref: "trd_bad" });

    expect(await holdings.position(acc, "CRDB")).toBe(100n);
  });

  it("rejects a zero-quantity entry", async () => {
    const { holdings, acc } = setup();
    await expect(
      holdings.post({ accountId: acc, instrument: "CRDB", quantity: 0n, reason: "noop" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("drops netted-to-zero instruments from the positions map", async () => {
    const { holdings, acc } = setup();
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 100n, reason: "buy" });
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: -100n, reason: "sell" });
    expect((await holdings.positions(acc)).has("CRDB")).toBe(false);
  });

  it("writes append-only events (never updates)", async () => {
    const { events, holdings, acc } = setup();
    await holdings.post({ accountId: acc, instrument: "CRDB", quantity: 100n, reason: "buy" });
    const stored = await events.read(`holdings:${acc}`);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.type).toBe("HoldingPosted");
    expect(stored[0]?.payload["quantity"]).toBe("100"); // bigint stored as string
  });
});
