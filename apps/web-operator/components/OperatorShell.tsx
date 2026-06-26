"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserPlus, Wallet, Scale, ShieldCheck, ScrollText, Bell } from "lucide-react";
import { AppShell, Sidebar, TopBar, Avatar, Badge, type NavItem } from "@fimco/ui";

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard size={18} aria-hidden /> },
  { href: "/onboarding", label: "Onboarding", icon: <UserPlus size={18} aria-hidden /> },
  { href: "/accounts", label: "Accounts & Balances", icon: <Wallet size={18} aria-hidden /> },
  { href: "/reconciliation", label: "Reconciliation", icon: <Scale size={18} aria-hidden /> },
  { href: "/maker-checker", label: "Maker-checker", icon: <ShieldCheck size={18} aria-hidden /> },
  { href: "/audit", label: "Audit log", icon: <ScrollText size={18} aria-hidden /> },
];

function Brand() {
  return (
    <div>
      <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 shadow-sm">
        <img src="/fimco-logo.png" alt="FIMCO" className="h-6 w-auto" />
      </span>
      <span className="mt-2 block text-xs text-white/75">Broker Back Office</span>
    </div>
  );
}

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  // The gate (login) renders full-screen, without the app chrome.
  if (pathname === "/gate") return <>{children}</>;
  return (
    <AppShell
      banner={
        <div className="bg-warning-tint px-6 py-1.5 text-center text-xs font-medium text-warning">
          Demo environment · sample data — not real client money
        </div>
      }
      sidebar={
        <Sidebar
          brand={<Brand />}
          items={NAV}
          activeHref={pathname}
          LinkComponent={Link}
          footer={<span className="text-xs">Operator workspace · light mode</span>}
        />
      }
      topbar={
        <TopBar
          title="Operator Console"
          subtitle="Dar es Salaam Stock Exchange · sell-side back office"
          right={
            <>
              <Badge tone="success">nTZS test</Badge>
              <button aria-label="Notifications" className="rounded-pill p-2 text-muted hover:bg-surface-subtle">
                <Bell size={18} />
              </button>
              <Avatar name="Ops Staff" />
            </>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
