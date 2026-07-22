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
    new URL(
      `/login?callbackUrl=${encodeURIComponent(request.url)}`,
      request.url,
    ),
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|manifest.json|favicon.ico|public).*)",
  ],
};
