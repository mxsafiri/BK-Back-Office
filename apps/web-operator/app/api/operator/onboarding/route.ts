import { NextResponse } from "next/server";
import type { OnboardRequest } from "@fimco/api-client";
import { simulateOnboard } from "../../../../lib/demo";

// DEMO: simulate onboarding in-memory (no hosted API). Same request/response contract as the
// real backend, so swapping to the live API later is a one-line change.
export async function POST(req: Request) {
  let body: OnboardRequest;
  try {
    body = (await req.json()) as OnboardRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body?.externalId || !body?.email || !body?.applicant?.fullName || !body?.applicant?.phoneNumber) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = simulateOnboard(body);
  return NextResponse.json(result, { status: result.account ? 201 : 200 });
}
