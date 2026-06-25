import { describe, it, expect } from "vitest";
import { InMemoryEventStore } from "./eventStore.js";
import { SecuritiesLedger } from "./securitiesLedger.js";
import { HoldingsLedger } from "../accounts/holdings.js";
import { newId, type AccountId } from "@fimco/shared";
import { ValidationError, InsufficientHoldingsError } from "@fimco/shared";

function setup() {
  const events = new InMemoryEventStore();
  const holdings = new HoldingsLedger(events);
  const ledger = new SecuritiesLedger(events, holdings);
  const acc = newId("acc") as AccountId;
  return { events, holdings, ledger, acc };
}

describe("SecuritiesLedger", () => {
  it("places an order and projects it as open", async () => {
    const { ledger, acc } = setup();
    const order = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 100n });
    expect(order.status).toBe("open");
    expect((await ledger.getOrder(order.orderId)).executedQuantity).toBe(0n);
  });

  it("rejects a non-positive order quantity", async () => {
    const { ledger, acc } = setup();
    await expect(
      ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 0n }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("a buy execution credits holdings and fills the order", async () => {
    const { ledger, holdings, acc } = setup();
    const order = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 100n });

    await ledger.recordExecution({ orderId: order.orderId, quantity: 100n, priceMinorTzs: 500n });

    expect(await holdings.position(acc, "CRDB")).toBe(100n);
    expect((await ledger.getOrder(order.orderId)).status).toBe("filled");
  });

  it("supports partial fills and tracks executed quantity", async () => {
    const { ledger, acc } = setup();
    const order = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 100n });

    await ledger.recordExecution({ orderId: order.orderId, quantity: 40n, priceMinorTzs: 500n });
    let projected = await ledger.getOrder(order.orderId);
    expect(projected.status).toBe("partially_filled");
    expect(projected.executedQuantity).toBe(40n);

    await ledger.recordExecution({ orderId: order.orderId, quantity: 60n, priceMinorTzs: 510n });
    projected = await ledger.getOrder(order.orderId);
    expect(projected.status).toBe("filled");
    expect((await ledger.executionsForOrder(order.orderId)).length).toBe(2);
  });

  it("refuses to over-fill an order", async () => {
    const { ledger, acc } = setup();
    const order = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 100n });
    await expect(
      ledger.recordExecution({ orderId: order.orderId, quantity: 101n, priceMinorTzs: 500n }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("a sell execution debits holdings", async () => {
    const { ledger, holdings, acc } = setup();
    // Acquire first.
    const buy = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 100n });
    await ledger.recordExecution({ orderId: buy.orderId, quantity: 100n, priceMinorTzs: 500n });

    const sell = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "sell", quantity: 30n });
    await ledger.recordExecution({ orderId: sell.orderId, quantity: 30n, priceMinorTzs: 520n });

    expect(await holdings.position(acc, "CRDB")).toBe(70n);
  });

  it("refuses a sell that exceeds the held position (no naked short) and writes no execution", async () => {
    const { ledger, acc } = setup();
    const sell = await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "sell", quantity: 10n });
    await expect(
      ledger.recordExecution({ orderId: sell.orderId, quantity: 10n, priceMinorTzs: 500n }),
    ).rejects.toBeInstanceOf(ValidationError);
    // No execution was recorded.
    expect(await ledger.executionsForOrder(sell.orderId)).toHaveLength(0);
  });

  it("rejects an execution against an unknown order", async () => {
    const { ledger } = setup();
    await expect(
      ledger.recordExecution({ orderId: newId("ord"), quantity: 1n, priceMinorTzs: 1n }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("lists orders for an account", async () => {
    const { ledger, acc } = setup();
    await ledger.placeOrder({ accountId: acc, instrument: "CRDB", side: "buy", quantity: 10n });
    await ledger.placeOrder({ accountId: acc, instrument: "TBL", side: "buy", quantity: 20n });
    const orders = await ledger.ordersForAccount(acc);
    expect(orders).toHaveLength(2);
    expect(orders.map((o) => o.instrument).sort()).toEqual(["CRDB", "TBL"]);
  });

  it("guards holdings directly against oversell via the ledger's pre-check", async () => {
    // Belt-and-braces: even if a sell slipped the pre-check, holdings.post would refuse it.
    const { holdings, acc } = setup();
    await expect(
      holdings.post({ accountId: acc, instrument: "CRDB", quantity: -5n, reason: "x" }),
    ).rejects.toBeInstanceOf(InsufficientHoldingsError);
  });
});
