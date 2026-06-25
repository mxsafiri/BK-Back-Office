/**
 * Display-only money formatting. Takes INTEGER minor units (string|bigint|number) — never floats,
 * never does math beyond grouping. TZS minor unit == 1 TZS, so the integer is grouped directly.
 * Mirrors the backend rule: money is integer minor units; this is the display edge.
 */
export function formatMinor(minor: bigint | number | string): string {
  const v = typeof minor === "bigint" ? minor : BigInt(minor);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + grouped;
}

export function isNegativeMinor(minor: bigint | number | string): boolean {
  return (typeof minor === "bigint" ? minor : BigInt(minor)) < 0n;
}
