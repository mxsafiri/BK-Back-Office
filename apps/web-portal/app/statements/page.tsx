import { Download } from "lucide-react";
import { Card, PageHeader, Tag } from "@fimco/ui";

const STATEMENTS = [
  { period: "May 2026", type: "Monthly statement", issued: "01 Jun 2026" },
  { period: "Apr 2026", type: "Monthly statement", issued: "01 May 2026" },
  { period: "Q1 2026", type: "Quarterly statement", issued: "05 Apr 2026" },
];

export default function StatementsPage() {
  return (
    <>
      <PageHeader eyebrow="Documents" title="Statements & contract notes" subtitle="Download your periodic statements and trade contract notes." />
      <Card className="divide-y divide-hairline">
        {STATEMENTS.map((s) => (
          <div key={s.period} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-medium text-ink">{s.period}</p>
              <p className="text-xs text-muted">{s.type} · issued {s.issued}</p>
            </div>
            <div className="flex items-center gap-3">
              <Tag variant="tint">PDF</Tag>
              <button className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-subtle">
                <Download size={15} /> Download
              </button>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
