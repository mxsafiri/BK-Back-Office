import { describe, it, expect } from "vitest";
import { NtzsCashLedger } from "./ntzsCashLedger.js";
import { tzs, usdc } from "../../shared/money.js";
import { ExternalServiceError, ValidationError } from "../../shared/errors.js";

interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/** Build a mock fetch that records the last request and returns a canned JSON response. */
function mockFetch(response: { status?: number; json?: unknown; text?: string }) {
  const calls: Captured[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(init?.headers ?? {})) headers[k] = String(v);
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      headers,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    const text = response.text ?? JSON.stringify(response.json ?? {});
    return new Response(text, {
      status: response.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof globalThis.fetch;
  return { fn, calls };
}

const config = { apiBase: "https://www.ntzs.co.tz/api/v1", apiKey: "ntzs_test_secret" };

describe("NtzsCashLedger", () => {
  it("requires apiBase and apiKey", () => {
    expect(() => new NtzsCashLedger({ apiBase: "", apiKey: "k" })).toThrow(ValidationError);
    expect(() => new NtzsCashLedger({ apiBase: "x", apiKey: "" })).toThrow(ValidationError);
  });

  it("provisionAccount stores nTZS id (not our externalId) and the wallet address", async () => {
    const { fn, calls } = mockFetch({ json: { id: "usr_ntzs_123", walletAddress: "0xabc" } });
    const ledger = new NtzsCashLedger(config, fn);

    const result = await ledger.provisionAccount("client-external-1", "a@b.com");

    expect(result).toEqual({ userId: "usr_ntzs_123", walletAddress: "0xabc" });
    expect(calls[0]?.url).toBe("https://www.ntzs.co.tz/api/v1/users");
    expect(calls[0]?.body).toEqual({ externalId: "client-external-1", email: "a@b.com" });
    expect(calls[0]?.headers["Authorization"]).toBe("Bearer ntzs_test_secret");
  });

  it("getBalance reads the live integer TZS balance", async () => {
    const { fn, calls } = mockFetch({ json: { id: "usr_1", balance: 250000 } });
    const ledger = new NtzsCashLedger(config, fn);

    const bal = await ledger.getBalance("usr_1");

    expect(bal.currency).toBe("TZS");
    expect(bal.minor).toBe(250000n);
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.url).toBe("https://www.ntzs.co.tz/api/v1/users/usr_1");
  });

  it("rejects a non-integer balance rather than guessing", async () => {
    const { fn } = mockFetch({ json: { balance: 100.5 } });
    const ledger = new NtzsCashLedger(config, fn);
    await expect(ledger.getBalance("usr_1")).rejects.toBeInstanceOf(ExternalServiceError);
  });

  it("transfer sends integer amount + idempotency header and maps completed", async () => {
    const { fn, calls } = mockFetch({ json: { txHash: "0xfeed", status: "completed" } });
    const ledger = new NtzsCashLedger(config, fn);

    const ref = await ledger.transfer({
      fromUserId: "usr_a",
      toUserId: "usr_b",
      amount: tzs(5_000),
      idempotencyKey: "trade-1-fee",
    });

    expect(ref).toEqual({ txRef: "0xfeed", status: "completed" });
    expect(calls[0]?.body).toEqual({ fromUserId: "usr_a", toUserId: "usr_b", amount: 5000 });
    expect(calls[0]?.headers["Idempotency-Key"]).toBe("trade-1-fee");
  });

  it("withdraw maps the async 'requested' status for large amounts", async () => {
    const { fn } = mockFetch({ json: { id: "wd_1", status: "requested" } });
    const ledger = new NtzsCashLedger(config, fn);

    const ref = await ledger.withdraw({
      userId: "usr_a",
      amount: tzs(2_000_000),
      phoneNumber: "+255700000000",
      idempotencyKey: "wd-key-1",
    });

    expect(ref).toEqual({ txRef: "wd_1", status: "requested" });
  });

  it("deposit forwards collectToTreasury and the on-ramp phone", async () => {
    const { fn, calls } = mockFetch({ json: { id: "dep_1", status: "submitted" } });
    const ledger = new NtzsCashLedger(config, fn);

    const ref = await ledger.deposit({
      userId: "ntzs_escrow",
      amount: tzs(10_000),
      phoneNumber: "+255700000000",
      collectToTreasury: true,
      idempotencyKey: "dep-key-1",
    });

    expect(ref.status).toBe("submitted");
    expect(calls[0]?.body).toMatchObject({ userId: "ntzs_escrow", amount: 10000, collectToTreasury: true });
  });

  it("rejects non-TZS amounts (nTZS handles shillings only)", async () => {
    const { fn } = mockFetch({ json: {} });
    const ledger = new NtzsCashLedger(config, fn);
    await expect(
      ledger.transfer({ fromUserId: "a", toUserId: "b", amount: usdc(1_000_000), idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects non-positive amounts", async () => {
    const { fn } = mockFetch({ json: {} });
    const ledger = new NtzsCashLedger(config, fn);
    await expect(
      ledger.transfer({ fromUserId: "a", toUserId: "b", amount: tzs(0), idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("surfaces a non-2xx error with status and never leaks the api key", async () => {
    const { fn } = mockFetch({ status: 402, json: { message: "insufficient treasury float" } });
    const ledger = new NtzsCashLedger(config, fn);

    const err = await ledger
      .transfer({ fromUserId: "a", toUserId: "b", amount: tzs(1), idempotencyKey: "k" })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ExternalServiceError);
    expect((err as ExternalServiceError).status).toBe(402);
    expect((err as Error).message).toContain("insufficient treasury float");
    expect((err as Error).message).not.toContain("ntzs_test_secret");
  });

  it("throws on an unexpected terminal status rather than reporting success", async () => {
    const { fn } = mockFetch({ json: { id: "x", status: "failed" } });
    const ledger = new NtzsCashLedger(config, fn);
    await expect(
      ledger.transfer({ fromUserId: "a", toUserId: "b", amount: tzs(1), idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
