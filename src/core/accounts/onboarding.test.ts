import { describe, it, expect } from "vitest";
import { InMemoryEventStore } from "../ledger/eventStore.js";
import { AuditLog } from "../controls/auditLog.js";
import { InMemoryCashLedger } from "../../adapters/ntzs/inMemoryCashLedger.js";
import { StubKycProvider } from "../../adapters/kyc/stubKycProvider.js";
import { InMemoryAccountStore, canTransact } from "./account.js";
import { OnboardingService } from "./onboarding.js";
import { newId, type ClientId } from "../../shared/ids.js";
import { tzs } from "../../shared/money.js";

const validNin = "12345678901234567890";

function setup(kyc = new StubKycProvider()) {
  const events = new InMemoryEventStore();
  const audit = new AuditLog(events);
  const cash = new InMemoryCashLedger();
  const accounts = new InMemoryAccountStore();
  const svc = new OnboardingService({ kyc, cash, accounts, audit });
  return { audit, cash, accounts, svc };
}

function applicant() {
  return { fullName: "Asha Mussa", phoneNumber: "+255700000001", nationalId: validNin };
}

describe("OnboardingService", () => {
  it("verified KYC -> active account, cash leg provisioned, full audit trail", async () => {
    const { audit, cash, svc } = setup();
    const clientId = newId("cli") as ClientId;

    const { account, kyc } = await svc.onboard({
      clientId,
      externalId: "client-ext-1",
      email: "asha@example.com",
      applicant: applicant(),
    });

    expect(kyc.decision).toBe("verified");
    expect(account).toBeDefined();
    expect(account && canTransact(account)).toBe(true);
    // Cash leg linked via the nTZS id; balance starts at zero.
    expect(account?.cashUserId).toBeTruthy();
    expect((await cash.getBalance(account!.cashUserId)).minor).toBe(0n);

    const actions = (await audit.entries()).map((e) => e.action);
    expect(actions).toEqual(["kyc.verified", "account.opened"]);
  });

  it("can then fund the client via an nTZS deposit and hold a balance", async () => {
    const { cash, svc } = setup();
    const { account } = await svc.onboard({
      clientId: newId("cli") as ClientId,
      externalId: "client-ext-2",
      email: "x@example.com",
      applicant: applicant(),
    });

    await cash.deposit({
      userId: account!.cashUserId,
      amount: tzs(100_000),
      phoneNumber: "+255700000001",
      idempotencyKey: "dep-1",
    });

    expect((await cash.getBalance(account!.cashUserId)).minor).toBe(100_000n);
  });

  it("rejected KYC -> no account, no wallet provisioned, only the kyc audit event", async () => {
    const { audit, accounts, svc } = setup();
    const clientId = newId("cli") as ClientId;

    const { account, kyc } = await svc.onboard({
      clientId,
      externalId: "client-ext-3",
      email: "y@example.com",
      applicant: { fullName: "No Id", phoneNumber: "+255700000002" }, // no identifier -> rejected
    });

    expect(kyc.decision).toBe("rejected");
    expect(account).toBeUndefined();
    expect(await accounts.byClient(clientId)).toHaveLength(0);
    expect((await audit.entries()).map((e) => e.action)).toEqual(["kyc.verified"]);
  });

  it("review KYC -> pending account, then maker activates it", async () => {
    const { audit, svc } = setup(new StubKycProvider({ reviewNins: new Set([validNin]) }));
    const { account, kyc } = await svc.onboard({
      clientId: newId("cli") as ClientId,
      externalId: "client-ext-4",
      email: "z@example.com",
      applicant: applicant(),
    });

    expect(kyc.decision).toBe("review");
    expect(account?.status).toBe("pending");
    expect(account && canTransact(account)).toBe(false);

    const activated = await svc.activate(account!.id, "ops.bob", "manual review cleared");
    expect(activated.status).toBe("active");
    expect((await audit.entries()).map((e) => e.action)).toEqual([
      "kyc.verified",
      "account.opened",
      "account.activated",
    ]);
  });

  it("refuses to activate an already-active account", async () => {
    const { svc } = setup();
    const { account } = await svc.onboard({
      clientId: newId("cli") as ClientId,
      externalId: "client-ext-5",
      email: "a@example.com",
      applicant: applicant(),
    });
    await expect(svc.activate(account!.id, "ops.bob", "x")).rejects.toThrow();
  });
});
