import { Card, SectionCard, MoneyAmount, Button, Banner, KeyValueList } from "@fimco/ui";

export default function CashPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-muted">Cash account · nTZS</p>
        <h1 className="font-heading text-2xl font-bold text-ink">Your cash balance</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Available</p>
          <p className="mt-2 font-heading text-3xl font-bold text-ink"><MoneyAmount minor={"1100000"} /></p>
          <div className="mt-4">
            <KeyValueList
              items={[
                { label: "Reserved (open orders)", value: <MoneyAmount minor={"150000"} /> },
                { label: "Total balance", value: <MoneyAmount minor={"1250000"} /> },
              ]}
            />
          </div>
          <p className="mt-4 text-xs text-muted">Balances are read live from nTZS — never cached.</p>
        </Card>

        <SectionCard title="Move money" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-hairline p-4">
              <h4 className="font-heading font-semibold text-ink">Deposit</h4>
              <p className="mt-1 text-sm text-muted">On-ramp from mobile money or card; nTZS is minted 1:1.</p>
              <Button className="mt-3">Deposit funds</Button>
            </div>
            <div className="rounded-lg border border-hairline p-4">
              <h4 className="font-heading font-semibold text-ink">Withdraw</h4>
              <p className="mt-1 text-sm text-muted">Off-ramp to mobile money.</p>
              <Button variant="secondary" className="mt-3">Withdraw funds</Button>
            </div>
          </div>
          <Banner tone="warning" title="Large withdrawals" className="mt-4">
            Withdrawals of <strong>TZS 1,000,000 or more</strong> need nTZS admin approval and may stay
            <strong> requested</strong> until cleared — you&apos;ll be notified when they complete.
          </Banner>
        </SectionCard>
      </div>
    </>
  );
}
