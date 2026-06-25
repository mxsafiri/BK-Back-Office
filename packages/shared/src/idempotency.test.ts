import { describe, it, expect, vi } from "vitest";
import { InMemoryIdempotencyStore } from "./idempotency.js";

describe("idempotency", () => {
  it("runs the operation once per key and returns the original result", async () => {
    const store = new InMemoryIdempotencyStore();
    const op = vi.fn(async () => ({ txRef: "0xabc" }));

    const a = await store.once("k1", op);
    const b = await store.once("k1", op);

    expect(op).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it("treats different keys independently", async () => {
    const store = new InMemoryIdempotencyStore();
    const op = vi.fn(async () => Math.random());
    await store.once("k1", op);
    await store.once("k2", op);
    expect(op).toHaveBeenCalledTimes(2);
  });

  it("allows a retry after the operation fails (does not poison the key)", async () => {
    const store = new InMemoryIdempotencyStore();
    let attempts = 0;
    const op = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("transient");
      return { txRef: "0xok" };
    };

    await expect(store.once("k1", op)).rejects.toThrow("transient");
    // Retry with the same key must re-run and succeed, then cache the success.
    const second = await store.once("k1", op);
    const third = await store.once("k1", op);
    expect(second).toEqual({ txRef: "0xok" });
    expect(third).toEqual(second);
    expect(attempts).toBe(2);
  });

  it("collapses concurrent calls with the same key into one execution", async () => {
    const store = new InMemoryIdempotencyStore();
    const op = vi.fn(async () => "result");
    const [a, b] = await Promise.all([store.once("k1", op), store.once("k1", op)]);
    expect(op).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });
});
