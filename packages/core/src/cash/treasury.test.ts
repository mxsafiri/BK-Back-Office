import { describe, it, expect } from "vitest";
import { Treasury, TREASURY_PURPOSES, type TreasuryWalletMap } from "./treasury.js";
import { InMemoryCashLedger } from "../cash/inMemoryCashLedger.js";
import { tzs } from "@fimco/shared";
import { ValidationError } from "@fimco/shared";

const wallets: TreasuryWalletMap = {
  escrow: "ntzs_escrow",
  settlement: "ntzs_settlement",
  reserves: "ntzs_reserves",
  disbursement: "ntzs_disbursement",
  fees: "ntzs_fees",
};

function setup() {
  const cash = new InMemoryCashLedger();
  for (const id of Object.values(wallets)) cash.seed(id, tzs(0));
  const treasury = new Treasury(cash, wallets);
  return { cash, treasury };
}

describe("Treasury topology", () => {
  it("exposes the five purpose-segregated sub-wallets", () => {
    expect([...TREASURY_PURPOSES]).toEqual(["escrow", "settlement", "reserves", "disbursement", "fees"]);
  });

  it("rejects a config missing a purpose", () => {
    const { escrow: _omit, ...partial } = wallets;
    expect(() => new Treasury(new InMemoryCashLedger(), partial as TreasuryWalletMap)).toThrow(ValidationError);
  });

  it("rejects two purposes sharing a wallet (no segregation)", () => {
    expect(() => new Treasury(new InMemoryCashLedger(), { ...wallets, fees: wallets.settlement })).toThrow(
      ValidationError,
    );
  });

  it("collects from a client into a treasury sub-wallet", async () => {
    const { cash, treasury } = setup();
    cash.seed("client", tzs(10_000));

    await treasury.collect({ fromClientUserId: "client", to: "fees", amount: tzs(2_500), idempotencyKey: "fee-1" });

    expect((await cash.getBalance("client")).minor).toBe(7_500n);
    expect((await treasury.balanceOf("fees")).minor).toBe(2_500n);
  });

  it("moves firm funds between sub-wallets", async () => {
    const { cash, treasury } = setup();
    cash.seed(wallets.escrow, tzs(8_000));

    await treasury.move({ from: "escrow", to: "settlement", amount: tzs(8_000), idempotencyKey: "rel-1" });

    expect((await treasury.balanceOf("escrow")).minor).toBe(0n);
    expect((await treasury.balanceOf("settlement")).minor).toBe(8_000n);
  });

  it("refuses a no-op move within the same purpose", async () => {
    const { treasury } = setup();
    await expect(
      treasury.move({ from: "fees", to: "fees", amount: tzs(1), idempotencyKey: "x" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("disburses settled proceeds from disbursement to a client", async () => {
    const { cash, treasury } = setup();
    cash.seed(wallets.disbursement, tzs(5_000));
    cash.seed("client", tzs(0));

    await treasury.disburse({
      from: "disbursement",
      toClientUserId: "client",
      amount: tzs(5_000),
      idempotencyKey: "payout-1",
    });

    expect((await treasury.balanceOf("disbursement")).minor).toBe(0n);
    expect((await cash.getBalance("client")).minor).toBe(5_000n);
  });

  it("BLOCKS disbursing from reserves (T+0 settlement advance not permitted yet)", async () => {
    const { cash, treasury } = setup();
    cash.seed(wallets.reserves, tzs(100_000));

    await expect(
      treasury.disburse({ from: "reserves", toClientUserId: "client", amount: tzs(1_000), idempotencyKey: "adv-1" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
