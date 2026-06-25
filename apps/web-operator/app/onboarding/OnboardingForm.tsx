"use client";
import { useState } from "react";
import Link from "next/link";
import { FormField, Input, Button, Banner, Card, StatusBadge, KeyValueList } from "@fimco/ui";
import type { OnboardResponse } from "@fimco/api-client";

const EMPTY = { fullName: "", phoneNumber: "", nationalId: "", email: "", externalId: "" };

export function OnboardingForm() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OnboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/operator/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: form.externalId || `ext-${Date.now()}`,
          email: form.email,
          applicant: { fullName: form.fullName, phoneNumber: form.phoneNumber, nationalId: form.nationalId || undefined },
        }),
      });
      const data = (await res.json()) as OnboardResponse | { error: string };
      if (!res.ok) {
        setError("error" in data ? data.error : `HTTP ${res.status}`);
      } else {
        setResult(data as OnboardResponse);
      }
    } catch {
      setError("Could not reach the API. Is the backend running on :3001?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="p-6 lg:col-span-3">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="fullName" required>
              <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Asha Mussa" required />
            </FormField>
            <FormField label="Phone number" htmlFor="phone" required>
              <Input id="phone" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+255 700 000 000" required />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="National ID (NIDA)" htmlFor="nin" hint="20 digits — verified against NIDA (stub).">
              <Input id="nin" value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} placeholder="12345678901234567890" inputMode="numeric" />
            </FormField>
            <FormField label="Email" htmlFor="email" required>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="asha@example.com" required />
            </FormField>
          </div>
          <FormField label="External reference" htmlFor="ext" hint="Your stable client id, sent to nTZS as externalId. Auto-generated if blank.">
            <Input id="ext" value={form.externalId} onChange={(e) => set("externalId", e.target.value)} placeholder="ext-asha-001" />
          </FormField>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={busy}>Run KYC &amp; open account</Button>
            <span className="text-xs text-muted">KYC clears → cash wallet provisioned → account opened.</span>
          </div>
        </form>
      </Card>

      <div className="lg:col-span-2">
        {error && <Banner tone="danger" title="Onboarding failed">{error}</Banner>}
        {result && (
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold text-ink">Result</h3>
              <StatusBadge status={result.kyc.decision} />
            </div>
            {result.account ? (
              <>
                <KeyValueList
                  items={[
                    { label: "Account", value: <span className="font-mono text-xs">{result.account.id}</span> },
                    { label: "Status", value: <StatusBadge status={result.account.status} /> },
                    { label: "Cash wallet (nTZS)", value: <span className="font-mono text-xs">{result.account.cashUserId}</span> },
                    { label: "KYC method", value: result.kyc.method },
                    { label: "KYC reference", value: <span className="font-mono text-xs">{result.kyc.reference}</span> },
                  ]}
                />
                <Link
                  href={`/accounts?id=${encodeURIComponent(result.account.id)}`}
                  className="mt-4 inline-flex rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  View balance →
                </Link>
              </>
            ) : (
              <Banner tone="warning" title={`KYC ${result.kyc.decision}`}>
                No account was opened. {result.kyc.reasons?.length ? `Reasons: ${result.kyc.reasons.join(", ")}.` : ""}
              </Banner>
            )}
          </Card>
        )}
        {!result && !error && (
          <Card className="p-6 text-sm text-muted">
            Submit the form to run KYC and open an account. A verified applicant opens an <strong className="text-ink">active</strong> account;
            a review routes to <strong className="text-ink">pending</strong> for a second approver.
          </Card>
        )}
      </div>
    </div>
  );
}
