import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Extract subdomain from hostname
  const subdomain = hostname.split(".")[0];

  // Get the subdomain from X-Subdomain header (set by nginx/reverse proxy)
  const proxySubdomain = request.headers.get("X-Subdomain");
  const actualSubdomain = proxySubdomain || subdomain;

  // Route based on subdomain
  if (actualSubdomain === "auth") {
    // Auth subdomain - allow all (auth) paths
    if (!pathname.startsWith("/login") && !pathname.startsWith("/signup") && 
        !pathname.startsWith("/forgot-password") && !pathname.startsWith("/reset-password") &&
        !pathname.startsWith("/privacy-policy") && !pathname.startsWith("/profile") &&
        !pathname.startsWith("/_next") && !pathname.startsWith("/api") &&
        !pathname.startsWith("/public")) {
      // Redirect to login if accessing non-auth routes on auth subdomain
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (actualSubdomain === "compass" || actualSubdomain === "maps") {
    // Maps subdomain - allow all (maps) paths
    if (!pathname.startsWith("/location") && !pathname.startsWith("/noticeboard") &&
        !pathname.startsWith("/_next") && !pathname.startsWith("/api") &&
        !pathname.startsWith("/public")) {
      // Redirect to maps if accessing non-maps routes on maps subdomain
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
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
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
