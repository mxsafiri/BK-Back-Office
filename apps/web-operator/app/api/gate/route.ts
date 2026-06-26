import { NextResponse } from "next/server";

// Checks the shared demo password and sets an httpOnly cookie the middleware validates.
export async function POST(req: Request) {
  const password = process.env.DEMO_PASSWORD;
  const { value } = (await req.json().catch(() => ({}))) as { value?: string };
  if (!password || value !== password) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("fimco_demo", password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
