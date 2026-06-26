import { NextResponse, type NextRequest } from "next/server";

// Shared-password gate for the demo. If DEMO_PASSWORD is unset (e.g. local dev), the gate is off.
export function middleware(req: NextRequest) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return NextResponse.next();
  if (req.cookies.get("fimco_demo")?.value === password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/gate" || pathname === "/api/gate") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fimco-logo.png).*)"],
};
