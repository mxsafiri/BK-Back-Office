import { describe, it, expect } from "vitest";
import { tzs, usdc, add, subtract, compare, gte, isNegative, format, MoneyError } from "./money.js";

describe("money", () => {
  it("adds and subtracts in integer minor units", () => {
    expect(add(tzs(10_000), tzs(5_000)).minor).toBe(15_000n);
    expect(subtract(tzs(10_000), tzs(7_500)).minor).toBe(2_500n);
  });

  it("rejects currency mismatch", () => {
    expect(() => add(tzs(1), usdc(1))).toThrow(MoneyError);
    expect(() => compare(tzs(1), usdc(1))).toThrow(MoneyError);
  });

  it("rejects non-integer amounts at runtime (no floats)", () => {
    // tzs() accepts number for ergonomics but BigInt(1.5) throws — floats never become money.
    expect(() => tzs(1.5)).toThrow();
  });

  it("compares and detects negative", () => {
    expect(compare(tzs(1), tzs(2))).toBe(-1);
    expect(gte(tzs(2), tzs(2))).toBe(true);
    expect(isNegative(subtract(tzs(1), tzs(2)))).toBe(true);
  });

  it("formats TZS as whole units and USDC with 6 decimals", () => {
    expect(format(tzs(10_000))).toBe("TZS 10,000");
    expect(format(usdc(12_500_000))).toBe("USDC 12.500000");
  });

  it("is immutable", () => {
    const m = tzs(100);
    expect(() => {
      // @ts-expect-error — frozen
      m.minor = 200n;
    }).toThrow();
  });
});
