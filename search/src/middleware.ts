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
      // TODO: As in prod, due to nginx the request.url will be set to localhost.
      // Dev:
      // new URL(
      //   `${LOGIN_POINT}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      //   request.url,
      // ),
      // FIXME(prod): Prod
      new URL(`${LOGIN_POINT}`),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files like CSS, JS)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Any file with a common extension (e.g., logo.png, icon.svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.+\\.[\\w]+$).*)',
  ],
};
