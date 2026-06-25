import { NextResponse } from "next/server";
import { ApiError, type OnboardRequest } from "@fimco/api-client";
import { serverApi } from "@/lib/server-api";

// BFF: the browser POSTs here (same-origin, no token); we call the backend with the server token.
export async function POST(req: Request) {
  let body: OnboardRequest;
  try {
    body = (await req.json()) as OnboardRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const result = await serverApi().onboard(body);
    return NextResponse.json(result, { status: result.account ? 201 : 200 });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.code }, { status: err.status });
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
