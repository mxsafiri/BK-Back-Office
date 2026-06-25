/**
 * KYC port (CLAUDE.md: one integration adapter per external party, independently stubbable).
 *
 * Two verification methods are supported for the DSE/Tanzania context:
 *  - "nida":          identity verification against the National Identification Authority
 *                     (the applicant's 20-digit National Identification Number / NIN).
 *  - "bank_reliance": CDD reliance on a regulated bank's existing KYC for the applicant.
 *
 * NOTE (discovery item): exact NIDA fields, the bank-reliance attestation format, and the
 * screening obligations are pending. This port captures the SHAPE so onboarding can be built
 * and tested now; the live adapter plugs in once the specs land. Never log PII (NIN, DOB).
 */
export type KycMethod = "nida" | "bank_reliance";

export interface BankReference {
  /** Bank/institution code we are relying on for CDD. */
  readonly bankCode: string;
  /** The bank's reference for the verified customer (not the account number itself). */
  readonly customerRef: string;
}

export interface KycApplicant {
  readonly fullName: string;
  readonly phoneNumber: string;
  /** NIDA National Identification Number (20 digits). Optional if relying on a bank. */
  readonly nationalId?: string;
  /** ISO date (YYYY-MM-DD). */
  readonly dateOfBirth?: string;
  /** Present when relying on a bank's KYC instead of (or alongside) NIDA. */
  readonly bankReference?: BankReference;
}

/**
 * - verified: passed, may onboard.
 * - rejected: failed; do not onboard.
 * - review:   inconclusive; route to a human (maker-checker) before onboarding.
 * - pending:  provider is still processing (async); poll/await a callback.
 */
export type KycDecision = "verified" | "rejected" | "review" | "pending";

export interface KycResult {
  readonly decision: KycDecision;
  readonly method: KycMethod;
  /** Provider reference id, recorded for audit. Safe to log (no PII). */
  readonly reference: string;
  /** Machine-readable reasons for rejection/review (no PII). */
  readonly reasons?: readonly string[];
}

export interface KycProvider {
  verify(applicant: KycApplicant): Promise<KycResult>;
}
