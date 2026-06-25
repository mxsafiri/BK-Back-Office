import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyNtzsWebhook } from "./webhook.js";

const secret = "whsec_test_123";
const timestamp = "1719240000";
const rawBody = JSON.stringify({ type: "deposit.completed", data: { userId: "u1", amountTzs: 10000 } });

function sign(body: string, ts = timestamp, key = secret): string {
  return createHmac("sha256", key).update(`${ts}.${body}`).digest("hex");
}

describe("nTZS webhook verification", () => {
  it("accepts a correctly signed payload", () => {
    expect(verifyNtzsWebhook({ secret, timestamp, rawBody, signature: sign(rawBody) })).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = rawBody.replace("10000", "999999999");
    expect(verifyNtzsWebhook({ secret, timestamp, rawBody: tampered, signature: sign(rawBody) })).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(
      verifyNtzsWebhook({ secret, timestamp, rawBody, signature: sign(rawBody, timestamp, "whsec_wrong") }),
    ).toBe(false);
  });

  it("rejects a malformed signature without throwing", () => {
    expect(verifyNtzsWebhook({ secret, timestamp, rawBody, signature: "not-hex" })).toBe(false);
  });
});
