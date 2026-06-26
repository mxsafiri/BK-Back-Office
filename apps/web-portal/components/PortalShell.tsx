"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, cn } from "@fimco/ui";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/cash", label: "Cash" },
  { href: "/holdings", label: "Holdings" },
  { href: "/activity", label: "Activity" },
  { href: "/statements", label: "Statements" },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  return (
    <div className="min-h-screen bg-canvas-base">
      <header className="sticky top-0 z-10 border-b border-hairline bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/fimco-logo.png" alt="FIMCO" className="h-6 w-auto" />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((it) => {
              const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "rounded-pill px-3.5 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-wash text-brand" : "text-muted hover:text-ink",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:block">Asha Mussa</span>
            <Avatar name="Asha Mussa" size={32} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-6 py-8">{children}</main>
    </div>
  );
}
