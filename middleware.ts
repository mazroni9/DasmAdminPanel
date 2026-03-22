import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * يوجّه /login (legacy) إلى /auth/login مع الحفاظ على ?legacy=* للطوارئ.
 * يحوّل ?next= إلى ?returnUrl= ليتوافق مع صفحة الدخول الرسمية.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname !== "/login") {
    return NextResponse.next();
  }

  const legacy = searchParams.get("legacy");
  if (legacy === "1" || legacy === "session") {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  const next = searchParams.get("next");
  const returnUrl = searchParams.get("returnUrl");
  if (next && next.startsWith("/")) {
    url.searchParams.set("returnUrl", next);
  } else if (returnUrl && returnUrl.startsWith("/")) {
    url.searchParams.set("returnUrl", returnUrl);
  }
  url.searchParams.delete("next");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/login",
};
