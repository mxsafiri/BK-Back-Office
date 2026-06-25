import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { NtzsWebhookReceiver } from "./webhookReceiver.js";
import { CashMirror } from "@fimco/core";
import { AuditLog } from "@fimco/core";
import { InMemoryEventStore } from "@fimco/core";
import { InMemoryIdempotencyStore } from "@fimco/shared";

const SECRET = "whsec_test";

function sign(timestamp: string, rawBody: string): string {
  return createHmac("sha256", SECRET).update(`${timestamp}.${rawBody}`).digest("hex");
}

function delivery(body: unknown, opts?: { timestamp?: string; signature?: string }) {
  const rawBody = JSON.stringify(body);
  const timestamp = opts?.timestamp ?? "1700000000";
  return {
    timestamp,
    rawBody,
    signature: opts?.signature ?? sign(timestamp, rawBody),
  };
}

function setup() {
  const events = new InMemoryEventStore();
  const mirror = new CashMirror(events);
  const audit = new AuditLog(events);
  const idem = new InMemoryIdempotencyStore();
  const receiver = new NtzsWebhookReceiver({ secret: SECRET, mirror, audit, idem });
  return { mirror, audit, receiver };
}

describe("NtzsWebhookReceiver", () => {
  it("processes a verified deposit and credits the mirror", async () => {
    const { mirror, audit, receiver } = setup();
    const out = await receiver.handle(
      delivery({ id: "evt_1", type: "deposit.completed", data: { depositId: "dep_1", userId: "usr_a", amountTzs: 100000, txHash: "0xdep" } }),
    );

    expect(out).toEqual({ status: "processed", eventId: "evt_1", type: "deposit.completed" });
    expect((await mirror.balance("usr_a")).minor).toBe(100000n);
    expect((await audit.entries()).map((e) => e.action)).toContain("cash.deposit.confirmed");
  });

  it("rejects a bad signature without touching the mirror", async () => {
    const { mirror, receiver } = setup();
    const out = await receiver.handle(
      delivery({ id: "evt_2", type: "deposit.completed", data: { userId: "usr_a", amountTzs: 5, txHash: "x" } }, { signature: "deadbeef" }),
    );
    expect(out).toEqual({ status: "rejected", reason: "bad_signature" });
    expect((await mirror.balance("usr_a")).minor).toBe(0n);
  });

  it("rejects a payload missing the event id", async () => {
    const { receiver } = setup();
    const out = await receiver.handle(delivery({ type: "deposit.completed", data: {} }));
    expect(out).toEqual({ status: "rejected", reason: "bad_payload" });
  });

  it("is redelivery-safe: a duplicate event id is not applied twice", async () => {
    const { mirror, receiver } = setup();
    const evt = { id: "evt_dup", type: "deposit.completed", data: { userId: "usr_a", amountTzs: 7000, txHash: "0x" } };

    const first = await receiver.handle(delivery(evt));
    const second = await receiver.handle(delivery(evt));

    expect(first.status).toBe("processed");
    expect(second).toEqual({ status: "duplicate", eventId: "evt_dup" });
    expect((await mirror.balance("usr_a")).minor).toBe(7000n); // credited once, not 14000
  });

  it("mirrors both legs of a transfer", async () => {
    const { mirror, receiver } = setup();
    await receiver.handle(
      delivery({ id: "evt_t", type: "transfer.completed", data: { fromUserId: "usr_a", toUserId: "ntzs_fees", amountTzs: 2500, txHash: "0xt" } }),
    );
    expect((await mirror.balance("usr_a")).minor).toBe(-2500n);
    expect((await mirror.balance("ntzs_fees")).minor).toBe(2500n);
  });

  it("debits the mirror for a withdrawal", async () => {
    const { mirror, receiver } = setup();
    await receiver.handle(
      delivery({ id: "evt_w", type: "withdrawal.completed", data: { withdrawalId: "wd_1", userId: "usr_a", amountTzs: 3000, phoneNumber: "+255700000000" } }),
    );
    expect((await mirror.balance("usr_a")).minor).toBe(-3000n);
  });

  it("ignores an unknown event type without a cash effect", async () => {
    const { mirror, receiver } = setup();
    const out = await receiver.handle(delivery({ id: "evt_u", type: "swap.completed", data: {} }));
    expect(out.status).toBe("ignored");
    expect((await mirror.balances()).size).toBe(0);
  });

  it("throws on a malformed amount so the delivery is retried, not silently dropped", async () => {
    const { receiver } = setup();
    await expect(
      receiver.handle(delivery({ id: "evt_bad", type: "deposit.completed", data: { userId: "usr_a", amountTzs: 1.5, txHash: "0x" } })),
    ).rejects.toThrow();
  });
});
