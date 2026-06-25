import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * nTZS webhook signature verification (CLAUDE.md rule #2).
 * nTZS signs `${timestamp}.${rawBody}` with HMAC-SHA256 using your webhook secret.
 * ALWAYS verify before acting on an event. Reject on mismatch. Webhooks WILL be
 * redelivered — the caller must also dedupe by event id (idempotency).
 *
 * Pass the RAW request body bytes exactly as received — do not re-serialize parsed JSON.
 */
export function verifyNtzsWebhook(params: {
  secret: string;
  timestamp: string;
  rawBody: string;
  signature: string;
}): boolean {
  const signedPayload = `${params.timestamp}.${params.rawBody}`;
  const expected = createHmac("sha256", params.secret).update(signedPayload).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(params.signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type NtzsWebhookEvent =
  | { type: "deposit.completed"; data: { depositId: string; userId: string; amountTzs: number; txHash: string } }
  | { type: "transfer.completed"; data: { transferId: string; fromUserId: string; toUserId: string; amountTzs: number; txHash: string } }
  | { type: "withdrawal.completed"; data: { withdrawalId: string; userId: string; amountTzs: number; phoneNumber: string } };
