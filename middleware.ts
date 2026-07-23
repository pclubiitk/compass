import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") || "";

  const PUBLIC_PATHS = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/privacy-policy",
  ];

  const ALLOWED_WITHOUT_COOKIES = ["/maps", "/location"];

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isAllowedWithoutCookies = ALLOWED_WITHOUT_COOKIES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const hasSession =
    request.cookies.has("auth_token") || request.cookies.has("refresh_token");

  // console.log("[middleware] request", {
  //   host,
  //   pathname,
  //   isStaticAsset,
  //   isPublicPath,
  //   isAllowedWithoutCookies,
  //   hasSession,
  // });

  if (isPublicPath || isAllowedWithoutCookies) {
    // console.log("[middleware] allow", { pathname });
    return NextResponse.next();
  }

  if (hasSession) {
    // console.log("[middleware] allow-with-session", { pathname });
    return NextResponse.next();
  }

  // console.log("[middleware] block", {
  //   pathname,
  //   redirectTo: "/login",
  //   callbackUrl: request.url,
  // });

  return NextResponse.redirect(
    // TODO: As in prod, due to nginx the request.url will be set to localhost.
    // In Dev:
    // new URL(
    //   `/login?callbackUrl=${encodeURIComponent(request.url)}`,
    //   request.url,
    // ),
    // In Test:
    new URL("https://bsearch.pclub.in/login")
    // FIXME(Prod): In Prod:
    // new URL("https://search.pclub.in/login")
  );
}

export const config = {
  
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files like CSS, JS)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     * - Any file with a common extension (e.g., logo.png, icon.svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|sitemap.xml|robots.txt|.+\\.[\\w]+$).*)',
  ],
};
