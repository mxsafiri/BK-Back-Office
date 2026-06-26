import {
  ArrowRight,
  ShieldCheck,
  Scale,
  Wallet,
  Landmark,
  FileText,
  Users,
  BarChart3,
  Lock,
  Check,
} from "lucide-react";

const OPERATOR_URL = process.env.NEXT_PUBLIC_OPERATOR_URL || "https://fimco-operator.vercel.app";
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://fimco-portal.vercel.app";
const CONTACT = "mailto:v.muhagachi@gmail.com?subject=FIMCO%20Broker%20Back%20Office%20—%20full%20build";

const FEATURES = [
  { icon: Users, title: "Onboarding & KYC", body: "NIDA identity + bank-reliance checks, then a provisioned nTZS cash account — KYC-gated, maker-checked." },
  { icon: Wallet, title: "Cash & treasury", body: "Per-client nTZS sub-wallets and purpose-segregated treasury (escrow, settlement, reserves, disbursement, fees)." },
  { icon: Scale, title: "Securities ledger", body: "Append-only, event-sourced record of every order, execution and position. The audit trail is a by-product." },
  { icon: BarChart3, title: "Reconciliation", body: "Daily cash reconciliation proves our ledger matches live nTZS balances and surfaces every break." },
  { icon: FileText, title: "Fees & contract notes", body: "Configurable, versioned tariffs (brokerage, DSE/CMSA levies, VAT) and itemised, immutable contract notes." },
  { icon: Landmark, title: "Regulatory reporting", body: "CMSA and DSE reports in mandated formats, generated from the same event log that drives the ledger." },
];

const CONTROLS = [
  "Maker-checker on every money- or position-moving action (initiator ≠ approver)",
  "Idempotency on every financial operation — webhooks are redelivery-safe",
  "Money as integer minor units — never floating point",
  "Append-only ledgers — corrections are reversing entries, never edits",
  "Verified nTZS webhook signatures; secrets backend-only, never logged",
  "Least-privilege RBAC with default deny on every endpoint",
];

export default function LandingPage() {
  return (
    <main>
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-hairline bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <img src="/fimco-logo.png" alt="FIMCO" className="h-6 w-auto" />
          <div className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#platform" className="hover:text-ink">Platform</a>
            <a href="#ledgers" className="hover:text-ink">How it works</a>
            <a href="#products" className="hover:text-ink">Products</a>
            <a href="#trust" className="hover:text-ink">Controls</a>
          </div>
          <a href={OPERATOR_URL} className="rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
            View demo
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-canvas-brand text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Dar es Salaam Stock Exchange · sell-side
          </p>
          <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">
            The back office for Tanzania&apos;s capital markets
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            FIMCO Broker Back Office reconciles trades, settles both legs, and keeps client cash &amp; securities
            ledgers — with <span className="font-semibold text-white">nTZS</span> as the settlement rail and the
            audit trail built into the ledger.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={OPERATOR_URL} className="inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-white/90">
              Operator Console demo <ArrowRight size={16} aria-hidden />
            </a>
            <a href={PORTAL_URL} className="inline-flex items-center gap-2 rounded-pill border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Client Portal demo <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <p className="mt-6 text-sm text-white/60">Built around CMSA, DSE/CSD, TRA and nTZS.</p>
        </div>
      </section>

      {/* Two-ledger model */}
      <section id="ledgers" className="mx-auto w-full max-w-6xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">How it works</p>
        <h2 className="mt-2 max-w-2xl font-heading text-3xl font-bold text-ink">Two ledgers, settled together</h2>
        <p className="mt-3 max-w-2xl text-muted">
          A trade is settled only when both legs reconcile — delivery-versus-payment across two systems.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-hairline bg-surface p-7 shadow-sm">
            <Scale className="text-brand" aria-hidden />
            <h3 className="mt-4 font-heading text-lg font-semibold text-ink">Securities ledger — we build it</h3>
            <p className="mt-2 text-muted">
              An append-only, event-sourced record of every order, execution and position. Corrections are
              reversing entries, never edits — so the audit trail is a by-product, not an afterthought.
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-7 shadow-sm">
            <Wallet className="text-brand" aria-hidden />
            <h3 className="mt-4 font-heading text-lg font-semibold text-ink">Cash ledger — settled on nTZS</h3>
            <p className="mt-2 text-muted">
              Client money lives in per-client nTZS sub-wallets; firm funds are segregated by purpose. We never
              move shillings directly — we instruct nTZS and mirror the on-chain reference, reconciled daily.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="platform" className="border-y border-hairline bg-surface-subtle">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Platform</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-ink">Everything a dealing member needs</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-wash text-brand">
                  <f.icon size={20} aria-hidden />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto w-full max-w-6xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Two products, one system</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-ink">For your desk, and for your clients</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-hairline bg-surface p-7 shadow-sm">
            <h3 className="font-heading text-xl font-bold text-ink">Operator Console</h3>
            <p className="mt-2 flex-1 text-muted">
              The internal desk: onboarding approvals, account &amp; balance lookup, reconciliation breaks,
              maker-checker queue, and the audit log.
            </p>
            <a href={OPERATOR_URL} className="mt-5 inline-flex items-center gap-2 self-start rounded-pill bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
              Open the demo <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <div className="flex flex-col rounded-2xl border border-hairline bg-surface p-7 shadow-sm">
            <h3 className="font-heading text-xl font-bold text-ink">Client Portal</h3>
            <p className="mt-2 flex-1 text-muted">
              The client view: portfolio overview, live cash balance, holdings, statements and activity — clear,
              unambiguous money throughout.
            </p>
            <a href={PORTAL_URL} className="mt-5 inline-flex items-center gap-2 self-start rounded-pill border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
              Open the demo <ArrowRight size={16} aria-hidden />
            </a>
          </div>
        </div>
      </section>

      {/* Controls / trust */}
      <section id="trust" className="bg-canvas-brand text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Lock aria-hidden />
            </span>
            <h2 className="mt-5 font-heading text-3xl font-bold">Built like a system that moves client money</h2>
            <p className="mt-3 max-w-md text-white/80">
              Correctness, auditability and segregation of duties are not optional. The non-negotiables are
              enforced in the domain layer — not just the UI.
            </p>
            <a href={CONTACT} className="mt-6 inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover">
              Start the full build <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <ul className="space-y-3">
            {CONTROLS.map((c) => (
              <li key={c} className="flex items-start gap-3 text-sm text-white/90">
                <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
        <ShieldCheck className="mx-auto text-brand" size={32} aria-hidden />
        <h2 className="mt-4 font-heading text-3xl font-bold text-ink">See it running, then let&apos;s build it for real</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          The demos below are a working slice. Production adds the live nTZS integration, persistence, and the
          DSE/CSD settlement wiring — that&apos;s the full engagement.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={OPERATOR_URL} className="rounded-pill bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover">Operator demo</a>
          <a href={PORTAL_URL} className="rounded-pill border border-hairline bg-surface px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-subtle">Client demo</a>
          <a href={CONTACT} className="rounded-pill border border-hairline bg-surface px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-subtle">Talk to us</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <img src="/fimco-logo.png" alt="FIMCO" className="h-5 w-auto opacity-80" />
          <p className="text-xs text-muted">FIMCO Broker Back Office · for the Dar es Salaam Stock Exchange · demo environment</p>
        </div>
      </footer>
    </main>
  );
}
