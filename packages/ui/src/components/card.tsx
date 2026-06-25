import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-hairline bg-surface shadow-sm", className)}>{children}</div>;
}

export function SectionCard({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <h3 className="font-heading text-base font-semibold text-ink">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>}
        <h1 className="font-heading text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-hairline px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-wash text-brand">
        <span className="text-xl">∅</span>
      </div>
      <p className="font-heading text-base font-semibold text-ink">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function KeyValueList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="divide-y divide-hairline">
      {items.map((it) => (
        <div key={it.label} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm text-muted">{it.label}</dt>
          <dd className="text-right text-sm font-medium text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
