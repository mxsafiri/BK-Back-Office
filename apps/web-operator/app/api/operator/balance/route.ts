import { NextResponse } from "next/server";
import { simulateBalance } from "@/lib/demo";

// DEMO: simulate a live balance read (no hosted API).
export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "missing_account_id" }, { status: 400 });
  return NextResponse.json(simulateBalance(accountId));
}
