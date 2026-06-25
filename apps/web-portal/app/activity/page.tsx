import { Card, MoneyAmount, StatusBadge, PageHeader } from "@fimco/ui";

const ACTIVITY = [
  { date: "25 Jun 2026", what: "Deposit · mobile money", ref: "0xntzs…d4e1", amount: "250000", status: "Confirmed" },
  { date: "24 Jun 2026", what: "Buy · CRDB ×200 @ 1,800", ref: "trd_9a…22", amount: "-360000", status: "Settled" },
  { date: "22 Jun 2026", what: "Dividend · TBL", ref: "0xntzs…7b9c", amount: "48000", status: "Confirmed" },
  { date: "20 Jun 2026", what: "Withdrawal · mobile money", ref: "wd_41…08", amount: "-500000", status: "Requested" },
];

export default function ActivityPage() {
  return (
    <>
      <PageHeader eyebrow="History" title="Activity" subtitle="Deposits, trades, dividends, and withdrawals with their nTZS references." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Activity</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY.map((a, i) => (
              <tr key={i} className="border-b border-hairline last:border-0 even:bg-surface-alt">
                <td className="px-5 py-3 text-muted">{a.date}</td>
                <td className="px-5 py-3 font-medium text-ink">{a.what}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted">{a.ref}</td>
                <td className="px-5 py-3 text-right"><MoneyAmount minor={a.amount} colored /></td>
                <td className="px-5 py-3 text-right"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
