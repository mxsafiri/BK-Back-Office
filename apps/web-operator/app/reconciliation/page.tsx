import { PageHeader, Card, MoneyAmount, StatusBadge, Button } from "@fimco/ui";

// Illustrative until the list endpoint lands; shape mirrors the CashReconciliationJob report.
const BREAKS = [
  { account: "acc_7c…e1", instrument: "Cash (TZS)", securities: "250000", cash: "240000" },
];

export default function ReconciliationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Controls"
        title="Reconciliation breaks"
        subtitle="Where the securities ledger and the nTZS cash leg disagree. Corrections are reversing entries — never edits."
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h3 className="font-heading text-base font-semibold text-ink">Open breaks · daily run 06:00</h3>
          <StatusBadge status={BREAKS.length ? "Break" : "Settled"} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Leg</th>
              <th className="px-5 py-3 text-right">Securities ledger</th>
              <th className="px-5 py-3 text-right">nTZS cash</th>
              <th className="px-5 py-3 text-right">Drift</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {BREAKS.map((b, i) => {
              const drift = BigInt(b.cash) - BigInt(b.securities);
              return (
                <tr key={i} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-3 font-mono text-xs">{b.account}</td>
                  <td className="px-5 py-3">{b.instrument}</td>
                  <td className="px-5 py-3 text-right"><MoneyAmount minor={b.securities} /></td>
                  <td className="px-5 py-3 text-right"><MoneyAmount minor={b.cash} /></td>
                  <td className="px-5 py-3 text-right"><MoneyAmount minor={drift.toString()} colored /></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="secondary">Resolve</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
