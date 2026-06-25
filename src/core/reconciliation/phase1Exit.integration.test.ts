import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { InMemoryEventStore } from "../ledger/eventStore.js";
import { AuditLog } from "../controls/auditLog.js";
import { InMemoryCashLedger } from "../../adapters/ntzs/inMemoryCashLedger.js";
import { StubKycProvider } from "../../adapters/kyc/stubKycProvider.js";
import { InMemoryAccountStore, canTransact } from "../accounts/account.js";
import { OnboardingService } from "../accounts/onboarding.js";
import { CashMirror } from "../cash/cashMirror.js";
import { NtzsWebhookReceiver } from "../../adapters/ntzs/webhookReceiver.js";
import { CashReconciliationJob, CollectingAlerter } from "./cashReconciliation.js";
import { InMemoryIdempotencyStore } from "../../shared/idempotency.js";
import { newId, type ClientId } from "../../shared/ids.js";
import { tzs } from "../../shared/money.js";

/**
 * Phase 1 exit criterion (BUILD_PLAN): onboard a test client, fund via an nTZS deposit, hold a
 * cash balance, with a full audit trail, and the reconciliation job passes. This wires the whole
 * Phase 1 surface together and is the reference flow for the cash & ledger core.
 */
const SECRET = "whsec_phase1";
const sign = (ts: string, body: string) => createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");

describe("Phase 1 exit: onboard -> fund -> mirror -> reconcile", () => {
  it("runs the full cash core flow with a clean reconciliation and complete audit trail", async () => {
    const events = new InMemoryEventStore();
    const audit = new AuditLog(events);
    const cash = new InMemoryCashLedger();
    const accounts = new InMemoryAccountStore();
    const onboarding = new OnboardingService({ kyc: new StubKycProvider(), cash, accounts, audit });
    const mirror = new CashMirror(events);
    const receiver = new NtzsWebhookReceiver({ secret: SECRET, mirror, audit, idem: new InMemoryIdempotencyStore() });
    const alerter = new CollectingAlerter();
    const recon = new CashReconciliationJob({ cash, mirror, audit, alerter });

    // 1. Onboard: KYC verified -> active account with a provisioned cash leg.
    const { account } = await onboarding.onboard({
      clientId: newId("cli") as ClientId,
      externalId: "client-ext-phase1",
      email: "asha@example.com",
      applicant: { fullName: "Asha Mussa", phoneNumber: "+255700000001", nationalId: "12345678901234567890" },
    });
    expect(account && canTransact(account)).toBe(true);
    const userId = account!.cashUserId;

    // 2. Fund via an nTZS deposit (on-ramp); live balance reflects the mint.
    await cash.deposit({ userId, amount: tzs(250_000), phoneNumber: "+255700000001", idempotencyKey: "dep-phase1" });
    expect((await cash.getBalance(userId)).minor).toBe(250_000n);

    // 3. nTZS confirms the deposit via a signed webhook -> the mirror is credited.
    const body = JSON.stringify({
      id: "evt_dep_phase1",
      type: "deposit.completed",
      data: { depositId: "dep_1", userId, amountTzs: 250000, txHash: "0xntzs" },
    });
    const ts = "1700000000";
    expect((await receiver.handle({ timestamp: ts, rawBody: body, signature: sign(ts, body) })).status).toBe("processed");
    // Redelivery of the same event is safe (no double credit).
    expect((await receiver.handle({ timestamp: ts, rawBody: body, signature: sign(ts, body) })).status).toBe("duplicate");
    expect((await mirror.balance(userId)).minor).toBe(250_000n);

    // 4. Reconciliation passes: mirror == live nTZS balance, no alert.
    const report = await recon.run([userId]);
    expect(report.ok).toBe(true);
    expect(report.results[0]?.driftMinor).toBe(0n);
    expect(alerter.alerts).toHaveLength(0);

    // 5. Full audit trail across the flow.
    const actions = (await audit.entries()).map((e) => e.action);
    expect(actions).toEqual(
      expect.arrayContaining(["kyc.verified", "account.opened", "cash.deposit.confirmed", "reconciliation.completed"]),
    );
  });

  it("a missed webhook surfaces as a reconciliation break (mirror < live nTZS)", async () => {
    const events = new InMemoryEventStore();
    const audit = new AuditLog(events);
    const cash = new InMemoryCashLedger();
    const mirror = new CashMirror(events);
    const alerter = new CollectingAlerter();
    const recon = new CashReconciliationJob({ cash, mirror, audit, alerter });

    // nTZS minted funds (live balance) but the confirming webhook never arrived (mirror empty).
    cash.seed("usr_a", tzs(250_000));

    const report = await recon.run(["usr_a"]);

    expect(report.ok).toBe(false);
    expect(report.breaks[0]?.driftMinor).toBe(250_000n); // live exceeds mirror
    expect(alerter.alerts).toHaveLength(1);
  });
});
