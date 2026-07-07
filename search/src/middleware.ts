import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOGIN_POINT } from "@/lib/constant";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Local dev: search (:3000) and auth (:3001) are separate ports — cookies
  // don't line up for middleware. Let the page load; client checks the API.
  if (host.startsWith("localhost")) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("auth_token") ||
    request.cookies.has("refresh_token");

  if (!hasSession) {
    const callbackUrl = request.url;
    return NextResponse.redirect(
      new URL(
        `${LOGIN_POINT}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        request.url,
      ),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except basic Next.js static assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
