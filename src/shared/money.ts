/**
 * Money — integer MINOR units only. NEVER floating point. (CLAUDE.md rule #4)
 *
 * - TZS (nTZS): minor unit = 1 TZS (nTZS amounts are whole integer TZS).
 * - USDC: minor unit = 1e-6 USDC (6 decimals), still handled as integers.
 *
 * Amounts are stored as bigint to make float bugs impossible.
 */

export type Currency = "TZS" | "USDC";

/** Number of minor units per 1 major unit, per currency. */
export const MINOR_PER_MAJOR: Record<Currency, bigint> = {
  TZS: 1n, // nTZS is integer TZS
  USDC: 1_000_000n, // 6 decimals
};

export interface Money {
  readonly currency: Currency;
  readonly minor: bigint;
}

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export function money(currency: Currency, minor: bigint): Money {
  if (typeof minor !== "bigint") {
    throw new MoneyError("Money.minor must be a bigint (integer minor units).");
  }
  return Object.freeze({ currency, minor });
}

export const tzs = (minor: bigint | number): Money => money("TZS", BigInt(minor));
export const usdc = (minor: bigint | number): Money => money("USDC", BigInt(minor));

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.currency, a.minor + b.minor);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.currency, a.minor - b.minor);
}

export function isNegative(a: Money): boolean {
  return a.minor < 0n;
}

export function isZero(a: Money): boolean {
  return a.minor === 0n;
}

/** -1 if a<b, 0 if equal, 1 if a>b. */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.minor < b.minor) return -1;
  if (a.minor > b.minor) return 1;
  return 0;
}

export function gte(a: Money, b: Money): boolean {
  return compare(a, b) >= 0;
}

/**
 * Convert minor units to a JS number for an external API wire payload, asserting the value
 * is a safe integer first. Use ONLY at the adapter boundary, never for money math. Throws
 * rather than silently losing precision above 2^53.
 */
export function toWireMinor(a: Money): number {
  if (a.minor > BigInt(Number.MAX_SAFE_INTEGER) || a.minor < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new MoneyError(`Amount ${a.minor} exceeds safe-integer range for wire serialization.`);
  }
  return Number(a.minor);
}

/** Human-readable string, e.g. "TZS 10,000" or "USDC 12.500000". Display only. */
export function format(a: Money): string {
  const per = MINOR_PER_MAJOR[a.currency];
  if (per === 1n) {
    return `${a.currency} ${a.minor.toLocaleString("en-US")}`;
  }
  const neg = a.minor < 0n;
  const abs = neg ? -a.minor : a.minor;
  const major = abs / per;
  const frac = abs % per;
  const decimals = per.toString().length - 1;
  const fracStr = frac.toString().padStart(decimals, "0");
  return `${neg ? "-" : ""}${a.currency} ${major.toLocaleString("en-US")}.${fracStr}`;
}
