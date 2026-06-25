import { NextResponse } from "next/server";
import { ApiError } from "@fimco/api-client";
import { serverApi } from "@/lib/server-api";

// BFF: proxy a live balance read, injecting the server token.
export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "missing_account_id" }, { status: 400 });
  try {
    const result = await serverApi().getAccountBalance(accountId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.code }, { status: err.status });
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
