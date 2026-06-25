import { newId, type AccountId, type OrderId, type ExecutionId } from "@fimco/shared";
import { ValidationError } from "@fimco/shared";
import type { EventStore } from "./eventStore.js";
import type { HoldingsLedger } from "../accounts/holdings.js";

/**
 * Securities ledger (CLAUDE.md Phase 1): the append-only, event-sourced record of orders and
 * executions. Positions are a PROJECTION of executions, posted into the holdings sub-ledger
 * (the single source of truth for what a client owns). The audit trail is a by-product of this
 * event log; corrections are reversing entries, never UPDATE/DELETE (rule #5).
 *
 * Position accounting is trade-date: an execution moves the book position immediately. The cash
 * leg and CSD delivery happen later at settlement (Phase 2) — that orchestration is separate.
 *
 * Quantities and prices are INTEGER units (bigint): whole DSE shares, integer TZS per share.
 */
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "partially_filled" | "filled";

export interface Order {
  readonly orderId: OrderId;
  readonly accountId: AccountId;
  readonly instrument: string;
  readonly side: OrderSide;
  readonly quantity: bigint;
  readonly executedQuantity: bigint;
  readonly status: OrderStatus;
}

export interface Execution {
  readonly executionId: ExecutionId;
  readonly orderId: OrderId;
  readonly accountId: AccountId;
  readonly instrument: string;
  readonly side: OrderSide;
  readonly quantity: bigint;
  /** Execution price per share, integer TZS minor units. */
  readonly priceMinorTzs: bigint;
}

const STREAM = "securities";

export class SecuritiesLedger {
  constructor(
    private readonly events: EventStore,
    private readonly holdings: HoldingsLedger,
  ) {}

  /** Capture a new order. Returns the open order. */
  async placeOrder(input: {
    accountId: AccountId;
    instrument: string;
    side: OrderSide;
    quantity: bigint;
  }): Promise<Order> {
    if (input.quantity <= 0n) {
      throw new ValidationError("Order quantity must be a positive integer.");
    }
    const orderId = newId("ord");
    await this.events.append(STREAM, [
      {
        type: "OrderPlaced",
        payload: {
          orderId,
          accountId: input.accountId,
          instrument: input.instrument,
          side: input.side,
          quantity: input.quantity.toString(),
        },
      },
    ]);
    return {
      orderId,
      accountId: input.accountId,
      instrument: input.instrument,
      side: input.side,
      quantity: input.quantity,
      executedQuantity: 0n,
      status: "open",
    };
  }

  /**
   * Record a fill against an open order and post the position effect to holdings
   * (buy -> credit, sell -> debit). Refuses to over-fill an order or to oversell a holding.
   *
   * NOTE: the execution append and the holdings post must be ONE transaction in production
   * (Postgres). Here they are sequential; the sell is pre-checked against the live position so
   * a coverable sell never half-writes.
   */
  async recordExecution(input: {
    orderId: OrderId;
    quantity: bigint;
    priceMinorTzs: bigint;
  }): Promise<Execution> {
    if (input.quantity <= 0n) throw new ValidationError("Execution quantity must be positive.");
    if (input.priceMinorTzs < 0n) throw new ValidationError("Execution price cannot be negative.");

    const order = await this.getOrder(input.orderId);
    if (order.executedQuantity + input.quantity > order.quantity) {
      throw new ValidationError(
        `Execution of ${input.quantity} exceeds open quantity ${order.quantity - order.executedQuantity} on ${order.orderId}.`,
      );
    }

    // Pre-check a sell against the live position so we never append an execution we cannot post.
    if (order.side === "sell") {
      const position = await this.holdings.position(order.accountId, order.instrument);
      if (position < input.quantity) {
        throw new ValidationError(
          `Sell of ${input.quantity} ${order.instrument} exceeds position ${position} on ${order.accountId}.`,
        );
      }
    }

    const executionId = newId("exe");
    await this.events.append(STREAM, [
      {
        type: "OrderExecuted",
        payload: {
          executionId,
          orderId: order.orderId,
          accountId: order.accountId,
          instrument: order.instrument,
          side: order.side,
          quantity: input.quantity.toString(),
          priceMinorTzs: input.priceMinorTzs.toString(),
        },
      },
    ]);

    await this.holdings.post({
      accountId: order.accountId,
      instrument: order.instrument,
      quantity: order.side === "buy" ? input.quantity : -input.quantity,
      reason: `execution:${executionId}`,
      ref: executionId,
    });

    return {
      executionId,
      orderId: order.orderId,
      accountId: order.accountId,
      instrument: order.instrument,
      side: order.side,
      quantity: input.quantity,
      priceMinorTzs: input.priceMinorTzs,
    };
  }

  /** Project an order's current state from the event log. */
  async getOrder(orderId: OrderId): Promise<Order> {
    const all = await this.events.read(STREAM);
    let base: Order | undefined;
    let executed = 0n;
    for (const e of all) {
      if (e.payload["orderId"] !== orderId) continue;
      if (e.type === "OrderPlaced") {
        base = {
          orderId,
          accountId: e.payload["accountId"] as AccountId,
          instrument: e.payload["instrument"] as string,
          side: e.payload["side"] as OrderSide,
          quantity: BigInt(e.payload["quantity"] as string),
          executedQuantity: 0n,
          status: "open",
        };
      } else if (e.type === "OrderExecuted") {
        executed += BigInt(e.payload["quantity"] as string);
      }
    }
    if (!base) throw new ValidationError(`Unknown order ${orderId}`);
    return { ...base, executedQuantity: executed, status: statusOf(executed, base.quantity) };
  }

  /** All orders for an account, projected from the event log. */
  async ordersForAccount(accountId: AccountId): Promise<Order[]> {
    const all = await this.events.read(STREAM);
    const ids: OrderId[] = [];
    for (const e of all) {
      if (e.type === "OrderPlaced" && e.payload["accountId"] === accountId) {
        ids.push(e.payload["orderId"] as OrderId);
      }
    }
    return Promise.all(ids.map((id) => this.getOrder(id)));
  }

  /** All executions recorded against an order. */
  async executionsForOrder(orderId: OrderId): Promise<Execution[]> {
    const all = await this.events.read(STREAM);
    const out: Execution[] = [];
    for (const e of all) {
      if (e.type !== "OrderExecuted" || e.payload["orderId"] !== orderId) continue;
      out.push({
        executionId: e.payload["executionId"] as ExecutionId,
        orderId,
        accountId: e.payload["accountId"] as AccountId,
        instrument: e.payload["instrument"] as string,
        side: e.payload["side"] as OrderSide,
        quantity: BigInt(e.payload["quantity"] as string),
        priceMinorTzs: BigInt(e.payload["priceMinorTzs"] as string),
      });
    }
    return out;
  }
}

function statusOf(executed: bigint, quantity: bigint): OrderStatus {
  if (executed === 0n) return "open";
  if (executed < quantity) return "partially_filled";
  return "filled";
}
