/** Tiny class combiner — joins truthy class strings. Keep classes non-conflicting by design. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
