import type { OnboardRequest, OnboardResponse, AccountBalanceResponse } from "@fimco/api-client";

/**
 * DEMO backend (static, Vercel-only). Simulates the onboarding + balance flows in-memory using
 * the real @fimco/api-client DTO contract, so the demo runs with no hosted API. The real domain
 * logic lives in @fimco/core behind the Fastify API — that's the paid-phase backend.
 */
export const DEMO_ACCOUNT_ID = "acc_demo_0001";

const NIN_RE = /^\d{20}$/;
let seq = 0;
const rand = () => Math.random().toString(36).slice(2, 10);
const ref = (method: string) => `kyc_demo_${method}_${seq++}`;

export function simulateOnboard(input: OnboardRequest): OnboardResponse {
  const nin = input.applicant?.nationalId;
  // Mirror StubKycProvider: a clearly-invalid NIN is rejected; otherwise the applicant clears.
  if (nin && !NIN_RE.test(nin)) {
    return { kyc: { decision: "rejected", method: "nida", reference: ref("nida"), reasons: ["invalid_nin_format"] } };
  }
  const method = nin ? "nida" : "bank_reliance";
  return {
    kyc: { decision: "verified", method, reference: ref(method) },
    account: {
      id: `acc_${rand()}`,
      clientId: input.clientId ?? `cli_${rand()}`,
      cashUserId: `ntzs_${input.externalId}`,
      kycReference: ref(method),
      status: "active",
      openedAt: new Date().toISOString(),
    },
  };
}

export function simulateBalance(accountId: string): AccountBalanceResponse {
  // The seeded demo account is funded; a freshly-onboarded account starts at zero (realistic).
  const funded = accountId === DEMO_ACCOUNT_ID;
  const minor = funded ? "2500000" : "0";
  return {
    accountId,
    status: "active",
    cashUserId: funded ? "ntzs_demo" : `ntzs_${accountId}`,
    currency: "TZS",
    liveBalanceMinor: minor,
    mirrorBalanceMinor: minor,
  };
}
