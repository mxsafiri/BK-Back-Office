import Link from "next/link";
import { UserPlus, Wallet, Scale, ArrowRight } from "lucide-react";
import { PageHeader, KpiTile, SectionCard, StatusBadge, MoneyAmount, Card } from "@fimco/ui";

const ACTIVITY = [
  { who: "ntzs", action: "Deposit confirmed", subject: "usr_8f…21 · TZS 250,000", status: "Confirmed", at: "2 min ago" },
  { who: "ops.alice", action: "Onboarding proposed", subject: "cli_a3…77 (Asha Mussa)", status: "Pending", at: "14 min ago" },
  { who: "ops.bob", action: "Withdrawal approved", subject: "req_55…02 · TZS 1,200,000", status: "Requested", at: "1 hr ago" },
  { who: "system", action: "Reconciliation completed", subject: "412 accounts · 1 break", status: "Break", at: "Today 06:00" },
];

const QUICK = [
  { href: "/onboarding", label: "Onboard a client", icon: <UserPlus size={18} /> },
  { href: "/accounts", label: "Look up a balance", icon: <Wallet size={18} /> },
  { href: "/reconciliation", label: "Review breaks", icon: <Scale size={18} /> },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Overview" title="Good morning, Ops" subtitle="Here's what needs attention across the desk today." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Pending onboarding" value="7" delta={{ value: "3 today", positive: true }} />
        <KpiTile label="Reconciliation breaks" value="1" hint="Daily cash recon · 06:00" />
        <KpiTile label="Maker-checker queue" value="4" hint="Awaiting a second approver" />
        <KpiTile label="Fees collected (today)" value={<MoneyAmount minor={"4250000"} />} delta={{ value: "8%", positive: true }} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Recent activity" className="lg:col-span-2">
          <ul className="divide-y divide-hairline">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{a.action}</p>
                  <p className="truncate text-xs text-muted">
                    {a.subject} · <span className="font-mono">{a.who}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-muted">{a.at}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <Card className="p-5">
          <h3 className="font-heading text-base font-semibold text-ink">Quick actions</h3>
          <p className="mt-1 text-sm text-muted">Common back-office tasks.</p>
          <div className="mt-4 space-y-2">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-brand-wash"
              >
                <span className="flex items-center gap-3">
                  <span className="text-brand">{q.icon}</span>
                  {q.label}
                </span>
                <ArrowRight size={16} className="text-muted" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
