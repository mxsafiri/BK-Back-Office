import { describe, it, expect } from "vitest";
import { StubKycProvider } from "./stubKycProvider.js";

const validNin = "12345678901234567890"; // 20 digits

describe("StubKycProvider", () => {
  it("verifies a syntactically valid NIN via nida", async () => {
    const kyc = new StubKycProvider();
    const r = await kyc.verify({ fullName: "A", phoneNumber: "+255700000000", nationalId: validNin });
    expect(r.decision).toBe("verified");
    expect(r.method).toBe("nida");
    expect(r.reference).toMatch(/^kyc_stub_nida_/);
  });

  it("rejects a malformed NIN", async () => {
    const kyc = new StubKycProvider();
    const r = await kyc.verify({ fullName: "A", phoneNumber: "+255700000000", nationalId: "123" });
    expect(r.decision).toBe("rejected");
    expect(r.reasons).toContain("invalid_nin_format");
  });

  it("verifies via bank reliance when no NIN is supplied", async () => {
    const kyc = new StubKycProvider();
    const r = await kyc.verify({
      fullName: "A",
      phoneNumber: "+255700000000",
      bankReference: { bankCode: "CRDB", customerRef: "cust-1" },
    });
    expect(r.decision).toBe("verified");
    expect(r.method).toBe("bank_reliance");
  });

  it("rejects when no identifier is provided at all", async () => {
    const kyc = new StubKycProvider();
    const r = await kyc.verify({ fullName: "A", phoneNumber: "+255700000000" });
    expect(r.decision).toBe("rejected");
    expect(r.reasons).toContain("no_identifier_provided");
  });

  it("routes configured NINs to review and rejection", async () => {
    const kyc = new StubKycProvider({
      reviewNins: new Set([validNin]),
      rejectNins: new Set(["99999999999999999999"]),
    });
    expect((await kyc.verify({ fullName: "A", phoneNumber: "+1", nationalId: validNin })).decision).toBe("review");
    expect(
      (await kyc.verify({ fullName: "B", phoneNumber: "+1", nationalId: "99999999999999999999" })).decision,
    ).toBe("rejected");
  });
});
