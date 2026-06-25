import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { buildServer } from "./server.js";
import { buildContainer } from "./container.js";
import type { ApiConfig } from "./config.js";
import type { Principal } from "./auth.js";

const config: ApiConfig = {
  port: 0,
  ntzs: { webhookSecret: "whsec_test", signatureHeader: "x-ntzs-signature", timestampHeader: "x-ntzs-timestamp" },
  authTokens: new Map<string, Principal>([["op-token", { userId: "ops.test", roles: ["operator"] }]]),
};

const OP = { authorization: "Bearer op-token" };
const validNin = "12345678901234567890";
const sign = (ts: string, body: string) => createHmac("sha256", "whsec_test").update(`${ts}.${body}`).digest("hex");

function setup() {
  const container = buildContainer(config);
  const { app } = buildServer({ config, container });
  return { app, container };
}

describe("API", () => {
  it("GET /health is public and ok", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("POST /onboarding denies unauthenticated requests (default-deny)", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "POST", url: "/onboarding", payload: { externalId: "x", email: "a@b.com", applicant: { fullName: "A", phoneNumber: "+255700000000", nationalId: validNin } } });
    expect(res.statusCode).toBe(401);
  });

  it("POST /onboarding with operator role opens an active account", async () => {
    const { app } = setup();
    const res = await app.inject({
      method: "POST",
      url: "/onboarding",
      headers: OP,
      payload: { externalId: "client-1", email: "asha@example.com", applicant: { fullName: "Asha", phoneNumber: "+255700000001", nationalId: validNin } },
    });
    expect(res.statusCode).toBe(201);
    const out = res.json();
    expect(out.kyc.decision).toBe("verified");
    expect(out.account.status).toBe("active");
  });

  it("rejects an invalid onboarding body with 400", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "POST", url: "/onboarding", headers: OP, payload: { email: "a@b.com" } });
    expect(res.statusCode).toBe(400);
  });

  it("GET /accounts/:id/balance returns the live and mirrored balances", async () => {
    const { app } = setup();
    const onboard = await app.inject({
      method: "POST",
      url: "/onboarding",
      headers: OP,
      payload: { externalId: "client-2", email: "x@example.com", applicant: { fullName: "B", phoneNumber: "+255700000002", nationalId: validNin } },
    });
    const accountId = onboard.json().account.id as string;

    const res = await app.inject({ method: "GET", url: `/accounts/${accountId}/balance`, headers: OP });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.currency).toBe("TZS");
    expect(body.liveBalanceMinor).toBe("0");
    expect(body.mirrorBalanceMinor).toBe("0");
  });

  it("processes a signed nTZS deposit webhook and mirrors it", async () => {
    const { app, container } = setup();
    const ts = "1700000000";
    const raw = JSON.stringify({ id: "evt_api_1", type: "deposit.completed", data: { userId: "usr_a", amountTzs: 50000, txHash: "0xfeed" } });

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/ntzs",
      headers: { "content-type": "application/json", "x-ntzs-timestamp": ts, "x-ntzs-signature": sign(ts, raw) },
      payload: raw,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("processed");
    expect((await container.mirror.balance("usr_a")).minor).toBe(50000n);
  });

  it("rejects a webhook with a bad signature (401) without mirroring", async () => {
    const { app, container } = setup();
    const ts = "1700000000";
    const raw = JSON.stringify({ id: "evt_api_2", type: "deposit.completed", data: { userId: "usr_b", amountTzs: 99, txHash: "0x" } });

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/ntzs",
      headers: { "content-type": "application/json", "x-ntzs-timestamp": ts, "x-ntzs-signature": "deadbeef" },
      payload: raw,
    });

    expect(res.statusCode).toBe(401);
    expect((await container.mirror.balance("usr_b")).minor).toBe(0n);
  });
});
