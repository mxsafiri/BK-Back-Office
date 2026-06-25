import { describe, it, expect } from "vitest";
import { InMemoryEventStore } from "../ledger/eventStore.js";
import { AuditLog } from "./auditLog.js";
import { MakerCheckerRegistry } from "./makerChecker.js";
import { InMemoryIdempotencyStore } from "@fimco/shared";
import { InMemoryCashLedger } from "../cash/inMemoryCashLedger.js";
import { tzs } from "@fimco/shared";
import { SegregationOfDutiesError } from "@fimco/shared";

/**
 * Phase-0 exit criterion: a money-moving action is forced through
 * maker-checker + idempotency + audit. This is the template every money path must follow.
 */
describe("money move — maker-checker + idempotency + audit", () => {
  function setup() {
    const events = new InMemoryEventStore();
    const audit = new AuditLog(events);
    const mc = new MakerCheckerRegistry(audit);
    const idem = new InMemoryIdempotencyStore();
    const cash = new InMemoryCashLedger();
    cash.seed("client", tzs(50_000));
    cash.seed("treasury_fees", tzs(0));
    return { events, audit, mc, idem, cash };
  }

  it("requires a second user to approve, then executes once and audits every step", async () => {
    const { audit, mc, idem, cash } = setup();
    const action = { fromUserId: "client", toUserId: "treasury_fees", amount: tzs(5_000), idempotencyKey: "trade-1-fee" };

    // Maker proposes.
    const req = await mc.propose("cash.transfer", action, "ops.alice");

    // Same user cannot approve their own request.
    await expect(mc.approve(req.id, "ops.alice")).rejects.toBeInstanceOf(SegregationOfDutiesError);

    // A different user approves.
    await mc.approve(req.id, "ops.bob");

    // Execute through the idempotency store — twice with the same key.
    const exec = () =>
      idem.once(action.idempotencyKey, () =>
        mc.execute(req.id, (a: typeof action) =>
          cash.transfer(a),
        ),
      );
    const first = await exec();
    const second = await exec();

    expect(first.status).toBe("completed");
    expect(second).toEqual(first); // idempotent: no double-spend
    expect((await cash.getBalance("client")).minor).toBe(45_000n);
    expect((await cash.getBalance("treasury_fees")).minor).toBe(5_000n);

    // Audit trail captured propose -> approve -> execute.
    const actions = (await audit.entries()).map((e) => e.action);
    expect(actions).toEqual([
      "maker_checker.propose",
      "maker_checker.approve",
      "maker_checker.execute",
    ]);
  });
});
