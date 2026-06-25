import { describe, it, expect } from "vitest";
import { InMemoryEventStore } from "./eventStore.js";

describe("event store", () => {
  it("appends with monotonic per-stream sequence and timestamps", async () => {
    const store = new InMemoryEventStore();
    await store.append("trade:1", [{ type: "TradeCaptured", payload: { qty: 100 } }]);
    const more = await store.append("trade:1", [{ type: "TradePriced", payload: {} }]);
    const stream = await store.read("trade:1");

    expect(stream.map((e) => e.seq)).toEqual([0, 1]);
    expect(stream.map((e) => e.type)).toEqual(["TradeCaptured", "TradePriced"]);
    expect(more[0]?.at).toBeTruthy();
  });

  it("keeps streams independent", async () => {
    const store = new InMemoryEventStore();
    await store.append("a", [{ type: "X", payload: {} }]);
    await store.append("b", [{ type: "Y", payload: {} }]);
    expect((await store.read("a")).length).toBe(1);
    expect((await store.readAll()).length).toBe(2);
  });
});
