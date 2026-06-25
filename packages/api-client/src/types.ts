/**
 * Wire DTOs — the contract between the frontends and the API. Money crosses the wire as a
 * STRING of integer minor units (bigint is not JSON-safe); the browser only displays it and
 * must never do money math. These mirror the shapes served by apps/api.
 *
 * NOTE: keep these in sync with apps/api responses. A good follow-up is to have apps/api import
 * these request/response types so the contract has a single source of truth and cannot drift.
 */
export type KycDecision = "verified" | "rejected" | "review" | "pending";
export type KycMethod = "nida" | "bank_reliance";
export type AccountStatus = "pending" | "active" | "suspended" | "closed";

export interface BankReferenceDTO {
  bankCode: string;
  customerRef: string;
}

export interface ApplicantDTO {
  fullName: string;
  phoneNumber: string;
  nationalId?: string;
  dateOfBirth?: string;
  bankReference?: BankReferenceDTO;
}

export interface OnboardRequest {
  clientId?: string;
  externalId: string;
  email: string;
  applicant: ApplicantDTO;
}

export interface KycResultDTO {
  decision: KycDecision;
  method: KycMethod;
  reference: string;
  reasons?: string[];
}

export interface AccountDTO {
  id: string;
  clientId: string;
  cashUserId: string;
  kycReference: string;
  status: AccountStatus;
  openedAt: string;
}

export interface OnboardResponse {
  kyc: KycResultDTO;
  /** Present unless KYC was rejected/pending. */
  account?: AccountDTO;
}

export interface AccountBalanceResponse {
  accountId: string;
  status: AccountStatus;
  cashUserId: string;
  currency: string;
  /** Integer minor units as a string (e.g. "250000" TZS). Display only. */
  liveBalanceMinor: string;
  mirrorBalanceMinor: string;
}

export interface HealthResponse {
  status: string;
}

export interface ApiErrorBody {
  error: string;
}
