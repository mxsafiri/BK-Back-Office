"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { FormField, Input, Button, Card, MoneyAmount, StatusBadge, Banner, KeyValueList } from "@fimco/ui";
import type { AccountBalanceResponse } from "@fimco/api-client";

export function BalanceLookup({ initialId }: { initialId: string }) {
  const [id, setId] = useState(initialId);
  const [data, setData] = useState<AccountBalanceResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (accountId: string) => {
    if (!accountId) return;
    setBusy(true);
    setErr(null);
    setData(null);
    try {
      const res = await fetch(`/api/operator/balance?accountId=${encodeURIComponent(accountId)}`);
      const body = await res.json();
      if (!res.ok) setErr(body.error ?? `HTTP ${res.status}`);
      else setData(body as AccountBalanceResponse);
    } catch {
      setErr("Could not reach the API. Is the backend running on :3001?");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) load(initialId);
  }, [initialId, load]);

  const drift = data ? BigInt(data.liveBalanceMinor) - BigInt(data.mirrorBalanceMinor) : 0n;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(id.trim());
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <FormField label="Account ID" htmlFor="acc" hint="e.g. the acc_… returned by onboarding.">
              <Input id="acc" value={id} onChange={(e) => setId(e.target.value)} placeholder="acc_…" className="font-mono" />
            </FormField>
          </div>
          <Button type="submit" loading={busy} leadingIcon={<Search size={16} />}>
            Look up
          </Button>
        </form>
      </Card>

      {err && <Banner tone="danger" title="Lookup failed">{err}</Banner>}

      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Live nTZS balance</p>
            <p className="mt-2 font-heading text-3xl font-bold text-ink">
              <MoneyAmount minor={data.liveBalanceMinor} />
            </p>
            <p className="mt-1 text-xs text-muted">Read live from nTZS — never cached.</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Mirrored balance</p>
            <p className="mt-2 font-heading text-3xl font-bold text-ink">
              <MoneyAmount minor={data.mirrorBalanceMinor} />
            </p>
            <p className="mt-1 text-xs text-muted">Our ledger projection of confirmed movements.</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Reconciliation</p>
            <div className="mt-3">
              <StatusBadge status={drift === 0n ? "Settled" : "Break"} />
            </div>
            <div className="mt-3">
              <KeyValueList
                items={[
                  { label: "Account", value: <span className="font-mono text-xs">{data.accountId}</span> },
                  { label: "Status", value: <StatusBadge status={data.status} /> },
                  { label: "Drift", value: <MoneyAmount minor={drift.toString()} colored /> },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
