import { Card, MoneyAmount, PageHeader } from "@fimco/ui";

const HOLDINGS = [
  { code: "CRDB", name: "CRDB Bank Plc", qty: "1,200", cost: "1980000", value: "2160000", pl: "180000" },
  { code: "TBL", name: "Tanzania Breweries Ltd", qty: "500", cost: "1895000", value: "1850000", pl: "-45000" },
  { code: "NMB", name: "NMB Bank Plc", qty: "300", cost: "760000", value: "820000", pl: "60000" },
];

export default function HoldingsPage() {
  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Holdings" subtitle="Your securities positions on the Dar es Salaam Stock Exchange." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <th className="px-5 py-3">Instrument</th>
              <th className="px-5 py-3 text-right">Quantity</th>
              <th className="px-5 py-3 text-right">Cost basis</th>
              <th className="px-5 py-3 text-right">Market value</th>
              <th className="px-5 py-3 text-right">Unrealised P/L</th>
            </tr>
          </thead>
          <tbody>
            {HOLDINGS.map((h) => (
              <tr key={h.code} className="border-b border-hairline last:border-0 even:bg-surface-alt">
                <td className="px-5 py-3">
                  <span className="font-medium text-ink">{h.code}</span>
                  <span className="block text-xs text-muted">{h.name}</span>
                </td>
                <td className="px-5 py-3 text-right tabular">{h.qty}</td>
                <td className="px-5 py-3 text-right"><MoneyAmount minor={h.cost} /></td>
                <td className="px-5 py-3 text-right"><MoneyAmount minor={h.value} /></td>
                <td className="px-5 py-3 text-right"><MoneyAmount minor={h.pl} colored /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
