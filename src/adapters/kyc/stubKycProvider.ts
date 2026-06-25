import type { KycApplicant, KycProvider, KycResult, KycMethod } from "./KycProvider.js";

/**
 * Deterministic KYC stub — stands in for the live NIDA + bank-reliance integration so the
 * onboarding flow builds and tests without external access (CLAUDE.md: every adapter is
 * independently stubbable). Rules are intentionally simple and predictable for tests:
 *
 *  - A bank reference (with a bankCode + customerRef) verifies via "bank_reliance".
 *  - Otherwise a syntactically valid NIN (20 digits) verifies via "nida".
 *  - A malformed NIN is rejected; no identifier at all is rejected (cannot verify).
 *  - NINs in `reviewNins` route to "review"; NINs in `rejectNins` are rejected, so tests can
 *    exercise the maker-checker / decline paths.
 *
 * This stub keeps NO state and performs no real screening. Do not use in production.
 */
export interface StubKycOptions {
  readonly rejectNins?: ReadonlySet<string>;
  readonly reviewNins?: ReadonlySet<string>;
}

const NIN_RE = /^\d{20}$/;

export class StubKycProvider implements KycProvider {
  constructor(private readonly options: StubKycOptions = {}) {}

  async verify(applicant: KycApplicant): Promise<KycResult> {
    const nin = applicant.nationalId;

    if (nin) {
      if (this.options.rejectNins?.has(nin)) {
        return result("rejected", "nida", ["denylist_match"]);
      }
      if (this.options.reviewNins?.has(nin)) {
        return result("review", "nida", ["manual_review_required"]);
      }
      if (!NIN_RE.test(nin)) {
        return result("rejected", "nida", ["invalid_nin_format"]);
      }
      return result("verified", "nida");
    }

    if (applicant.bankReference?.bankCode && applicant.bankReference?.customerRef) {
      return result("verified", "bank_reliance");
    }

    return result("rejected", "nida", ["no_identifier_provided"]);
  }
}

let seq = 0;
function result(decision: KycResult["decision"], method: KycMethod, reasons?: string[]): KycResult {
  // Synthetic, PII-free reference for audit traceability in tests.
  const reference = `kyc_stub_${method}_${seq++}`;
  return reasons ? { decision, method, reference, reasons } : { decision, method, reference };
}
