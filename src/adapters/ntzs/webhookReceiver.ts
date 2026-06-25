import { verifyNtzsWebhook } from "./webhook.js";
import type { AuditLog } from "../../core/controls/auditLog.js";
import type { IdempotencyStore } from "../../shared/idempotency.js";
import type { CashMirror } from "../../core/cash/cashMirror.js";

/**
 * nTZS webhook receiver (CLAUDE.md rule #2 + Phase 1). Responsibilities:
 *  1. Verify the HMAC-SHA256 signature over `${timestamp}.${rawBody}`; reject on mismatch.
 *  2. Dedupe by event id — webhooks WILL be redelivered; processing is idempotent/redelivery-safe.
 *  3. Dispatch confirmed cash movements into the cash mirror (rule #6) and emit audit events.
 *
 * Pass the RAW request body exactly as received (do not re-serialize parsed JSON), or the
 * signature will not match.
 */
export interface NtzsWebhookDelivery {
  readonly timestamp: string;
  readonly rawBody: string;
  readonly signature: string;
}

export type WebhookOutcome =
  | { readonly status: "processed"; readonly eventId: string; readonly type: string }
  | { readonly status: "ignored"; readonly eventId: string; readonly type: string }
  | { readonly status: "duplicate"; readonly eventId: string }
  | { readonly status: "rejected"; readonly reason: "bad_signature" | "bad_payload" };

interface Envelope {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export class NtzsWebhookReceiver {
  constructor(
    private readonly deps: {
      secret: string;
      mirror: CashMirror;
      audit: AuditLog;
      idem: IdempotencyStore;
    },
  ) {}

  async handle(delivery: NtzsWebhookDelivery): Promise<WebhookOutcome> {
    // 1. Verify signature BEFORE touching the payload. Never act on an unsigned/forged event.
    const ok = verifyNtzsWebhook({
      secret: this.deps.secret,
      timestamp: delivery.timestamp,
      rawBody: delivery.rawBody,
      signature: delivery.signature,
    });
    if (!ok) return { status: "rejected", reason: "bad_signature" };

    const env = parseEnvelope(delivery.rawBody);
    if (!env) return { status: "rejected", reason: "bad_payload" };

    // 2. Dedupe by event id. A redelivery returns "duplicate" without re-applying side effects.
    let ran = false;
    const outcome = await this.deps.idem.once(`ntzs_webhook:${env.id}`, async () => {
      ran = true;
      return this.dispatch(env);
    });
    return ran ? outcome : { status: "duplicate", eventId: env.id };
  }

  /** Apply one verified, de-duplicated event. Throws on a malformed/unparseable payload so the
   *  delivery is retried rather than silently dropped. */
  private async dispatch(env: Envelope): Promise<WebhookOutcome> {
    const { mirror, audit } = this.deps;
    switch (env.type) {
      case "deposit.completed": {
        const userId = reqStr(env.data, "userId");
        const amount = reqAmount(env.data, "amountTzs");
        const txRef = reqStr(env.data, "txHash");
        await mirror.record({ userId, amountTzsMinor: amount, txRef, eventId: env.id, reason: env.type });
        await audit.record({
          action: "cash.deposit.confirmed",
          actor: "ntzs",
          subject: userId,
          meta: { eventId: env.id, txRef, amountTzsMinor: amount.toString() },
        });
        return { status: "processed", eventId: env.id, type: env.type };
      }
      case "transfer.completed": {
        const fromUserId = reqStr(env.data, "fromUserId");
        const toUserId = reqStr(env.data, "toUserId");
        const amount = reqAmount(env.data, "amountTzs");
        const txRef = reqStr(env.data, "txHash");
        // Mirror both legs so balances stay double-entry consistent.
        await mirror.record({ userId: fromUserId, amountTzsMinor: -amount, txRef, eventId: env.id, reason: env.type });
        await mirror.record({ userId: toUserId, amountTzsMinor: amount, txRef, eventId: env.id, reason: env.type });
        await audit.record({
          action: "cash.transfer.confirmed",
          actor: "ntzs",
          subject: txRef,
          meta: { eventId: env.id, fromUserId, toUserId, amountTzsMinor: amount.toString() },
        });
        return { status: "processed", eventId: env.id, type: env.type };
      }
      case "withdrawal.completed": {
        const userId = reqStr(env.data, "userId");
        const amount = reqAmount(env.data, "amountTzs");
        const txRef = strOrUndef(env.data, "txHash") ?? reqStr(env.data, "withdrawalId");
        await mirror.record({ userId, amountTzsMinor: -amount, txRef, eventId: env.id, reason: env.type });
        await audit.record({
          action: "cash.withdrawal.confirmed",
          actor: "ntzs",
          subject: userId,
          meta: { eventId: env.id, txRef, amountTzsMinor: amount.toString() },
        });
        return { status: "processed", eventId: env.id, type: env.type };
      }
      default:
        // Unknown event type: record it for visibility but apply no cash effect.
        await audit.record({ action: "cash.webhook.ignored", actor: "ntzs", subject: env.id, meta: { type: env.type } });
        return { status: "ignored", eventId: env.id, type: env.type };
    }
  }
}

function parseEnvelope(rawBody: string): Envelope | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const obj = parsed as Record<string, unknown>;
  const id = obj["id"];
  const type = obj["type"];
  const data = obj["data"];
  if (typeof id !== "string" || id.length === 0) return undefined;
  if (typeof type !== "string" || type.length === 0) return undefined;
  if (typeof data !== "object" || data === null) return undefined;
  return { id, type, data: data as Record<string, unknown> };
}

class WebhookPayloadError extends Error {}

function reqStr(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new WebhookPayloadError(`Webhook payload missing string field "${key}".`);
  }
  return v;
}

function strOrUndef(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** nTZS amounts are integer TZS. Reject non-integer/negative to avoid corrupting the mirror. */
function reqAmount(data: Record<string, unknown>, key: string): bigint {
  const v = data[key];
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    throw new WebhookPayloadError(`Webhook payload field "${key}" must be a non-negative integer TZS amount.`);
  }
  return BigInt(v);
}
