import type { CashLedger, CashRef } from "../../core/cash/CashLedger.js";
import { type Money, tzs, toWireMinor } from "../../shared/money.js";
import { ExternalServiceError, ValidationError } from "../../shared/errors.js";

/**
 * nTZS-backed CashLedger (CLAUDE.md money layer). We NEVER move shillings directly — every
 * method maps to an nTZS API call and records the returned on-chain tx reference, which is the
 * source of truth for the cash leg.
 *
 * Non-negotiables enforced here:
 *  - Secrets (the ntzs_live_/ntzs_test_ key) come from config and are used backend-only; the
 *    key is sent only in the Authorization header and is NEVER logged.
 *  - Money is integer minor units; only TZS (nTZS) is accepted. No floats.
 *  - Every mutating call carries a client-generated idempotency key (sent as a header AND
 *    layered by the caller's IdempotencyStore — webhooks/redeliveries must be safe).
 *  - We persist and use nTZS's `id` as userId, never our externalId.
 *
 * NOTE (discovery item 3): exact request/response field names follow the documented nTZS API
 * shape and MUST be reconciled against the live TEST environment before go-live. Parsing is
 * centralised in the mappers below so the wire contract is easy to pin down in one place.
 */
export interface NtzsConfig {
  /** e.g. https://www.ntzs.co.tz/api/v1 — from env, never hardcoded. */
  readonly apiBase: string;
  /** ntzs_test_… for all non-prod work; ntzs_live_… only in production. Backend-only. */
  readonly apiKey: string;
  /** Per-request timeout in ms. */
  readonly timeoutMs?: number;
}

type FetchFn = typeof globalThis.fetch;

export class NtzsCashLedger implements CashLedger {
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchFn;

  constructor(config: NtzsConfig, fetchFn: FetchFn = globalThis.fetch) {
    if (!config.apiBase) throw new ValidationError("NtzsConfig.apiBase is required.");
    if (!config.apiKey) throw new ValidationError("NtzsConfig.apiKey is required.");
    this.apiBase = config.apiBase.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 15_000;
    this.fetchFn = fetchFn;
  }

  async provisionAccount(externalId: string, email: string): Promise<{ userId: string; walletAddress: string }> {
    const body = await this.request("POST", "/users", { externalId, email });
    const id = str(body, "id");
    const walletAddress = str(body, "walletAddress") ?? deepStr(body, ["wallet", "address"]);
    if (!id || !walletAddress) {
      throw new ExternalServiceError("ntzs", "Provision response missing id/walletAddress.");
    }
    // Store THEIR id as userId for all subsequent deposits/transfers/withdrawals.
    return { userId: id, walletAddress };
  }

  async getBalance(userId: string): Promise<Money> {
    const body = await this.request("GET", `/users/${encodeURIComponent(userId)}`);
    // Live on-chain balance (no caching). Integer TZS.
    const raw = num(body, "balance") ?? deepNum(body, ["balance", "tzs"]) ?? deepNum(body, ["balance", "available"]);
    if (raw === undefined) {
      throw new ExternalServiceError("ntzs", `Balance missing for user ${userId}.`);
    }
    if (!Number.isInteger(raw)) {
      throw new ExternalServiceError("ntzs", `Balance for ${userId} is not an integer TZS amount.`);
    }
    return tzs(BigInt(raw));
  }

  async deposit(params: {
    userId: string;
    amount: Money;
    phoneNumber: string;
    collectToTreasury?: boolean;
    idempotencyKey: string;
  }): Promise<CashRef> {
    assertTzs(params.amount);
    const body = await this.request(
      "POST",
      "/deposits",
      {
        userId: params.userId,
        amount: toWireMinor(params.amount),
        phoneNumber: params.phoneNumber,
        ...(params.collectToTreasury ? { collectToTreasury: true } : {}),
      },
      params.idempotencyKey,
    );
    return toCashRef("ntzs", body);
  }

  async transfer(params: {
    fromUserId: string;
    toUserId: string;
    amount: Money;
    idempotencyKey: string;
  }): Promise<CashRef> {
    assertTzs(params.amount);
    // Use toUserId OR toAddress, never both (CLAUDE.md). This path always uses toUserId.
    const body = await this.request(
      "POST",
      "/transfers",
      {
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        amount: toWireMinor(params.amount),
      },
      params.idempotencyKey,
    );
    return toCashRef("ntzs", body);
  }

  async withdraw(params: {
    userId: string;
    amount: Money;
    phoneNumber: string;
    idempotencyKey: string;
  }): Promise<CashRef> {
    assertTzs(params.amount);
    // >= 1,000,000 TZS requires nTZS admin approval and returns status "requested".
    // We do NOT assume instant completion — the async result arrives via webhook.
    const body = await this.request(
      "POST",
      "/withdrawals",
      {
        userId: params.userId,
        amount: toWireMinor(params.amount),
        phoneNumber: params.phoneNumber,
      },
      params.idempotencyKey,
    );
    return toCashRef("ntzs", body);
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`, // never logged
      Accept: "application/json",
    };
    if (body) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchFn(`${this.apiBase}${path}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
    } catch (err) {
      // Never include headers/secrets in the surfaced message.
      throw new ExternalServiceError("ntzs", `Request to ${method} ${path} failed: ${safeErr(err)}`);
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    const parsed: unknown = text ? safeJson(text) : {};
    if (!res.ok) {
      const detail = isRecord(parsed) ? (str(parsed, "message") ?? str(parsed, "error")) : undefined;
      throw new ExternalServiceError("ntzs", `nTZS ${method} ${path} -> ${res.status}${detail ? `: ${detail}` : ""}`, res.status);
    }
    if (!isRecord(parsed)) {
      throw new ExternalServiceError("ntzs", `nTZS ${method} ${path} returned a non-object body.`);
    }
    return parsed;
  }
}

// --- wire mappers (single place to reconcile against the real API) ---

function assertTzs(amount: Money): void {
  if (amount.currency !== "TZS") {
    throw new ValidationError(`nTZS only handles TZS; got ${amount.currency}.`);
  }
  if (amount.minor <= 0n) {
    throw new ValidationError("nTZS amount must be positive.");
  }
}

/** Map an nTZS status string to our CashRef status; throw on a failed/unknown terminal state. */
function toCashRef(service: string, body: Record<string, unknown>): CashRef {
  const txRef = str(body, "txHash") ?? str(body, "txRef") ?? str(body, "id");
  if (!txRef) throw new ExternalServiceError(service, "Response missing a transaction reference.");
  const status = (str(body, "status") ?? "").toLowerCase();
  switch (status) {
    case "completed":
    case "success":
    case "succeeded":
      return { txRef, status: "completed" };
    case "requested": // large withdrawal awaiting admin approval
      return { txRef, status: "requested" };
    case "submitted":
    case "pending":
    case "processing":
      return { txRef, status: "submitted" };
    default:
      throw new ExternalServiceError(service, `Unexpected nTZS status "${status}" for tx ${txRef}.`);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function num(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
}

function deepStr(obj: Record<string, unknown>, path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return typeof cur === "string" && cur.length > 0 ? cur : undefined;
}

function deepNum(obj: Record<string, unknown>, path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return typeof cur === "number" ? cur : undefined;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function safeErr(err: unknown): string {
  if (err instanceof Error) return err.name === "AbortError" ? "timeout" : err.message;
  return "unknown error";
}
