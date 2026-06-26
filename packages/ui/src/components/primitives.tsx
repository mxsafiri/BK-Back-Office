import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type Tone = "success" | "warning" | "danger" | "info" | "processing" | "neutral" | "brand";

const TONE: Record<Tone, string> = {
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
  processing: "bg-processing-tint text-processing",
  neutral: "bg-surface-subtle text-muted",
  brand: "bg-brand-wash text-brand",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Maps domain statuses (KYC, accounts, settlement, webhooks) to a semantic tone — one meaning per color.
const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  settled: "success",
  approved: "success",
  verified: "success",
  completed: "success",
  confirmed: "success",
  processed: "success",
  pending: "warning",
  review: "warning",
  requested: "warning",
  awaiting: "warning",
  failed: "danger",
  rejected: "danger",
  error: "danger",
  break: "danger",
  scheduled: "info",
  submitted: "processing",
  processing: "processing",
  suspended: "neutral",
  closed: "neutral",
  onhold: "neutral",
  duplicate: "neutral",
  ignored: "neutral",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status.toLowerCase().replace(/[\s_-]/g, "")] ?? "neutral";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge tone={tone} className={className}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone === "neutral" ? "bg-muted" : "bg-current")} />
      {label}
    </Badge>
  );
}

export function Tag({
  variant = "tint",
  children,
  className,
}: {
  variant?: "solid" | "tint" | "neutral";
  children: ReactNode;
  className?: string;
}) {
  const styles =
    variant === "solid" ? "bg-brand text-white" : variant === "neutral" ? "bg-surface-subtle text-muted" : "bg-brand-wash text-brand";
  return <span className={cn("inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium", styles, className)}>{children}</span>;
}

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full bg-brand-tint font-medium text-brand-pressed", className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-md bg-surface-subtle", className)} />;
}

export function Banner({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  // Errors/failures need prompt SR attention; other tones are polite.
  const assertive = tone === "danger";
  return (
    <div
      className={cn("rounded-lg border px-4 py-3 text-sm", TONE[tone], "border-current/20", className)}
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-0.5", "text-ink/80")}>{children}</div>}
    </div>
  );
}
