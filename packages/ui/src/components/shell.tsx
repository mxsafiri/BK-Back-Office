"use client";
import type { ReactNode, ElementType } from "react";
import { cn } from "../lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

export function Sidebar({
  brand,
  items,
  activeHref,
  footer,
  LinkComponent = "a",
}: {
  brand: ReactNode;
  items: NavItem[];
  activeHref: string;
  footer?: ReactNode;
  LinkComponent?: ElementType;
}) {
  const L = LinkComponent;
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-canvas-brand text-white">
      <div className="px-5 py-6">{brand}</div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => {
          const active = activeHref === it.href || (it.href !== "/" && activeHref.startsWith(it.href));
          return (
            <L
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-pill px-3 py-2 text-sm transition-colors",
                active ? "bg-white font-semibold text-brand" : "text-white/85 hover:bg-white/10",
              )}
            >
              {it.icon && <span className="text-base">{it.icon}</span>}
              <span className="flex-1">{it.label}</span>
              {it.badge}
            </L>
          );
        })}
      </nav>
      {footer && <div className="border-t border-white/15 px-4 py-4 text-sm text-white/80">{footer}</div>}
    </aside>
  );
}

export function TopBar({ title, subtitle, right }: { title: ReactNode; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-hairline bg-surface px-6 py-3">
      <div>
        <p className="font-heading text-lg font-semibold text-ink">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </header>
  );
}

export function AppShell({ sidebar, topbar, children }: { sidebar: ReactNode; topbar?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas-cream">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
