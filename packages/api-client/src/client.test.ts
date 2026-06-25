import { describe, it, expect } from "vitest";
import { createApiClient, ApiError } from "./client.js";

interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function mockFetch(response: { status?: number; json?: unknown }) {
  const calls: Captured[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(init?.headers ?? {})) headers[k] = String(v);
    calls.push({ url: String(url), method: init?.method ?? "GET", headers, body: init?.body ? JSON.parse(init.body as string) : undefined });
    return new Response(JSON.stringify(response.json ?? {}), { status: response.status ?? 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
  return { fn, calls };
}

describe("createApiClient", () => {
  it("sends the bearer token and JSON body on onboard", async () => {
    const { fn, calls } = mockFetch({ status: 201, json: { kyc: { decision: "verified", method: "nida", reference: "r" }, account: { id: "acc_1", status: "active" } } });
    const client = createApiClient({ baseUrl: "http://api.test/", getToken: () => "tok", fetchFn: fn });

    const res = await client.onboard({ externalId: "x", email: "a@b.com", applicant: { fullName: "A", phoneNumber: "+255700000000", nationalId: "1".repeat(20) } });

    expect(res.account?.id).toBe("acc_1");
    expect(calls[0]?.url).toBe("http://api.test/onboarding");
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.headers["Authorization"]).toBe("Bearer tok");
    expect(calls[0]?.body).toMatchObject({ externalId: "x", email: "a@b.com" });
  });

  it("builds the balance path and omits auth when no token getter", async () => {
    const { fn, calls } = mockFetch({ json: { accountId: "acc_1", status: "active", cashUserId: "u", currency: "TZS", liveBalanceMinor: "0", mirrorBalanceMinor: "0" } });
    const client = createApiClient({ baseUrl: "http://api.test", fetchFn: fn });

    const res = await client.getAccountBalance("acc_1");

    expect(res.liveBalanceMinor).toBe("0");
    expect(calls[0]?.url).toBe("http://api.test/accounts/acc_1/balance");
    expect(calls[0]?.headers["Authorization"]).toBeUndefined();
  });

  it("throws ApiError with the API error code on non-2xx", async () => {
    const { fn } = mockFetch({ status: 403, json: { error: "forbidden" } });
    const client = createApiClient({ baseUrl: "http://api.test", fetchFn: fn });

    const err = await client.getAccountBalance("acc_1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).code).toBe("forbidden");
  });
});
