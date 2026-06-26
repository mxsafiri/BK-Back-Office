"use client";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./form";

/**
 * Full-screen shared-password gate for the demo. Posts to the app's own /api/gate route handler
 * (same-origin) which sets the cookie; on success it returns to the originally-requested path.
 * Expects a /fimco-logo.png in the app's public dir.
 */
export function GateScreen({ subtitle }: { subtitle?: string }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      window.location.href = new URLSearchParams(window.location.search).get("from") || "/";
    } else {
      setErr(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-base px-4">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-8 shadow-md">
        <img src="/fimco-logo.png" alt="FIMCO" className="mx-auto h-7 w-auto" />
        <h1 className="mt-6 text-center font-heading text-xl font-bold text-ink">Demo access</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>}
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Access password"
            aria-label="Access password"
            error={err}
            autoFocus
          />
          {err && <p className="text-sm text-danger">Incorrect password.</p>}
          <Button type="submit" loading={busy} className="w-full">
            Enter demo
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-faint">Shared with FIMCO for evaluation.</p>
      </div>
    </div>
  );
}
