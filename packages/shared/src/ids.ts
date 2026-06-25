import { randomUUID } from "node:crypto";

/** Prefixed, sortable-enough opaque IDs. Prefix documents the entity type. */
export type Id<Prefix extends string> = `${Prefix}_${string}`;

export function newId<Prefix extends string>(prefix: Prefix): Id<Prefix> {
  return `${prefix}_${randomUUID()}` as Id<Prefix>;
}

export type TradeId = Id<"trd">;
export type OrderId = Id<"ord">;
export type ExecutionId = Id<"exe">;
export type AccountId = Id<"acc">;
export type ClientId = Id<"cli">;
export type CashTxId = Id<"ctx">;
export type RequestId = Id<"req">;
export type EventId = Id<"evt">;
