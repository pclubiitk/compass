import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOGIN_POINT } from "@/lib/constant";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const isStaticAsset = /\.[a-zA-Z0-9]+$/.test(pathname);

  if (host.startsWith("localhost")) {
    // console.log("[search middleware] allow-localhost", { host, pathname });
    return NextResponse.next();
  }

  if (isStaticAsset) {
    // console.log("[search middleware] allow-static-asset", { host, pathname });
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("auth_token") || request.cookies.has("refresh_token");

  // console.log("[search middleware] request", {
  //   host,
  //   pathname,
  //   isStaticAsset,
  //   hasSession,
  // });

  if (!hasSession) {
    // console.log("[search middleware] redirect-login", {
    //   host,
    //   pathname,
    //   callbackUrl: request.url,
    // });
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
