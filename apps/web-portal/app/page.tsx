import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { KpiTile, SectionCard, MoneyAmount, StatusBadge } from "@fimco/ui";

const HOLDINGS = [
  { code: "CRDB", name: "CRDB Bank", qty: "1,200", value: "2160000", pl: "180000" },
  { code: "TBL", name: "Tanzania Breweries", qty: "500", value: "1850000", pl: "-45000" },
  { code: "NMB", name: "NMB Bank", qty: "300", value: "820000", pl: "60000" },
];

const ACTIVITY = [
  { what: "Deposit · mobile money", amount: "250000", status: "Confirmed", at: "Today" },
  { what: "Buy · CRDB ×200", amount: "-360000", status: "Settled", at: "Yesterday" },
  { what: "Dividend · TBL", amount: "48000", status: "Confirmed", at: "3 days ago" },
];

export default function OverviewPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-muted">Welcome back, Asha</p>
        <h1 className="font-heading text-2xl font-bold text-ink">Your portfolio</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-canvas-brand p-6 text-white shadow-sm lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Total value</p>
          <p className="mt-2 font-heading text-3xl font-bold tabular">
            <MoneyAmount minor={"6080000"} className="font-bold text-white" />
          </p>
          <p className="mt-1 text-sm text-white/85">
            <span aria-hidden="true">↑</span>
            <span className="sr-only">Up</span> 2.4% · <MoneyAmount minor={"142000"} className="text-white/85" /> today
          </p>
        </div>
        <KpiTile label="Cash (nTZS)" value={<MoneyAmount minor={"1250000"} />} hint="Available to invest or withdraw" />
        <KpiTile label="Holdings value" value={<MoneyAmount minor={"4830000"} />} delta={{ value: "3.1%", positive: true }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/cash" className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
          <ArrowDownToLine size={16} aria-hidden /> Deposit
        </Link>
        <Link href="/cash" className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-subtle">
          <ArrowUpFromLine size={16} aria-hidden /> Withdraw
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Holdings"
          className="lg:col-span-2"
          action={<Link href="/holdings" className="text-sm font-medium text-brand hover:underline">See all</Link>}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-2">Instrument</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Value</th>
                <th className="pb-2 text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr key={h.code} className="border-t border-hairline">
                  <td className="py-3">
                    <span className="font-medium text-ink">{h.code}</span>
                    <span className="block text-xs text-muted">{h.name}</span>
                  </td>
                  <td className="py-3 text-right tabular">{h.qty}</td>
                  <td className="py-3 text-right"><MoneyAmount minor={h.value} /></td>
                  <td className="py-3 text-right"><MoneyAmount minor={h.pl} colored /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Recent activity">
          <ul className="space-y-3">
            {ACTIVITY.map((a) => (
              <li key={a.what} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{a.what}</p>
                  <p className="text-xs text-muted">{a.at}</p>
                </div>
                <div className="text-right">
                  <MoneyAmount minor={a.amount} colored />
                  <div className="mt-1"><StatusBadge status={a.status} /></div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
