import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatMinor, isNegativeMinor } from "../lib/money";

/**
 * The only sanctioned way to render currency. Takes integer minor units; never floats. Optionally
 * colors by sign (credits green, debits red) per DESIGN_SYSTEM.
 */
export function MoneyAmount({
  minor,
  currency = "TZS",
  colored = false,
  className,
}: {
  minor: bigint | number | string;
  currency?: string;
  colored?: boolean;
  className?: string;
}) {
  const neg = isNegativeMinor(minor);
  return (
    <span className={cn("tabular whitespace-nowrap font-medium", colored && (neg ? "text-danger" : "text-success"), className)}>
      {/* prefix inherits the parent text colour (works on light cards and dark/navy fills) */}
      <span className="opacity-70">{currency} </span>
      {formatMinor(minor)}
    </span>
  );
}

export function DeltaChip({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-xs font-semibold",
        positive ? "bg-success-tint text-success" : "bg-danger-tint text-danger",
      )}
    >
      {positive ? "↑" : "↓"} {value}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: ReactNode;
  delta?: { value: string; positive: boolean };
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="tabular font-heading text-2xl font-bold text-ink">{value}</span>
        {delta && <DeltaChip value={delta.value} positive={delta.positive} />}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-success text-white",
                active && "bg-brand text-white",
                !done && !active && "bg-surface-subtle text-muted",
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={cn("text-sm", active ? "font-medium text-ink" : "text-muted")}>{step}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-hairline" />}
          </li>
        );
      })}
    </ol>
  );
}
